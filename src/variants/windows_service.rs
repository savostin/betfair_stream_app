use crate::config::Config;
use std::sync::{Arc, OnceLock};
use tokio::sync::oneshot;
use windows_service::service::{
    ServiceControl, ServiceControlAccept, ServiceExitCode, ServiceState, ServiceStatus, ServiceType,
};
use windows_service::service_control_handler::{self, ServiceControlHandlerResult};
use windows_service::{define_windows_service, service_dispatcher};

const SERVICE_NAME: &str = "BetfairStreamProxy";

static CONFIG: OnceLock<Arc<Config>> = OnceLock::new();
static TLS: OnceLock<Arc<tokio_rustls::TlsConnector>> = OnceLock::new();
static SHUTDOWN_TX: OnceLock<std::sync::Mutex<Option<oneshot::Sender<()>>>> = OnceLock::new();

define_windows_service!(ffi_service_main, service_main);

pub fn run_as_service(
    config: Arc<Config>,
    tls: Arc<tokio_rustls::TlsConnector>,
) -> Result<(), Box<dyn std::error::Error>> {
    let _ = CONFIG.set(config);
    let _ = TLS.set(tls);
    let _ = SHUTDOWN_TX.set(std::sync::Mutex::new(None));

    service_dispatcher::start(SERVICE_NAME, ffi_service_main)?;
    Ok(())
}

fn service_main(_arguments: Vec<std::ffi::OsString>) {
    let _ = service_main_impl();
}

fn service_main_impl() -> Result<(), Box<dyn std::error::Error>> {
    let status_handle =
        {
            // Register service control handler.
            let handle = service_control_handler::register(SERVICE_NAME, move |control_event| {
                match control_event {
                    ServiceControl::Stop | ServiceControl::Shutdown => {
                        if let Some(lock) = SHUTDOWN_TX.get() {
                            if let Ok(mut guard) = lock.lock() {
                                if let Some(tx) = guard.take() {
                                    let _ = tx.send(());
                                }
                            }
                        }
                        ServiceControlHandlerResult::NoError
                    }
                    _ => ServiceControlHandlerResult::NotImplemented,
                }
            })?;

            // Tell SCM we are starting.
            handle.set_service_status(ServiceStatus {
                service_type: ServiceType::OWN_PROCESS,
                current_state: ServiceState::StartPending,
                controls_accepted: ServiceControlAccept::empty(),
                exit_code: ServiceExitCode::Win32(0),
                checkpoint: 1,
                wait_hint: std::time::Duration::from_secs(10),
                process_id: None,
            })?;

            handle
        };

    let (shutdown_tx, shutdown_rx) = oneshot::channel::<()>();
    if let Some(lock) = SHUTDOWN_TX.get() {
        if let Ok(mut guard) = lock.lock() {
            *guard = Some(shutdown_tx);
        }
    }

    // Running.
    status_handle.set_service_status(ServiceStatus {
        service_type: ServiceType::OWN_PROCESS,
        current_state: ServiceState::Running,
        controls_accepted: ServiceControlAccept::STOP | ServiceControlAccept::SHUTDOWN,
        exit_code: ServiceExitCode::Win32(0),
        checkpoint: 0,
        wait_hint: std::time::Duration::from_secs(0),
        process_id: None,
    })?;

    let config = CONFIG.get().cloned().ok_or("missing service config")?;
    let tls = TLS.get().cloned().ok_or("missing service tls")?;

    let rt = tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()?;

    let server_res =
        rt.block_on(async move { crate::app::run_server(config, tls, Some(shutdown_rx)).await });

    // Stop pending.
    status_handle.set_service_status(ServiceStatus {
        service_type: ServiceType::OWN_PROCESS,
        current_state: ServiceState::StopPending,
        controls_accepted: ServiceControlAccept::empty(),
        exit_code: ServiceExitCode::Win32(0),
        checkpoint: 1,
        wait_hint: std::time::Duration::from_secs(10),
        process_id: None,
    })?;

    match server_res {
        Ok(()) => {
            status_handle.set_service_status(ServiceStatus {
                service_type: ServiceType::OWN_PROCESS,
                current_state: ServiceState::Stopped,
                controls_accepted: ServiceControlAccept::empty(),
                exit_code: ServiceExitCode::Win32(0),
                checkpoint: 0,
                wait_hint: std::time::Duration::from_secs(0),
                process_id: None,
            })?;
            Ok(())
        }
        Err(e) => {
            status_handle.set_service_status(ServiceStatus {
                service_type: ServiceType::OWN_PROCESS,
                current_state: ServiceState::Stopped,
                controls_accepted: ServiceControlAccept::empty(),
                exit_code: ServiceExitCode::Win32(1),
                checkpoint: 0,
                wait_hint: std::time::Duration::from_secs(0),
                process_id: None,
            })?;
            Err(Box::new(e))
        }
    }
}
