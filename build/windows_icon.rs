pub fn set_windows_exe_icon() {
    let mut res = winres::WindowsResource::new();
    res.set_icon("assets/icon.ico");
    res.compile().expect("failed to compile Windows resources");
}
