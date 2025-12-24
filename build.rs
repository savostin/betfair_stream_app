fn main() {
    // Set the Windows executable icon.
    // Note: macOS/Linux "binary file" icons typically require bundling into an app/package.
    #[cfg(windows)]
    {
        windows_icon::set_windows_exe_icon();
    }
}

#[cfg(windows)]
#[path = "build/windows_icon.rs"]
mod windows_icon;
