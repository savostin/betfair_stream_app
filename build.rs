fn main() {
    // Set the Windows executable icon.
    // Note: macOS/Linux "binary file" icons typically require bundling into an app/package.
    #[cfg(windows)]
    {
        let mut res = winres::WindowsResource::new();
        res.set_icon("assets/icon.ico");
        res.compile().expect("failed to compile Windows resources");
    }
}
