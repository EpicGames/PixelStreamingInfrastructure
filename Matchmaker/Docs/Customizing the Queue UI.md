## Customizing the Queue UI

The Matchmaker server allows for custom HTML UI to be displayed. In order to create a custom queue UI template:

1. Duplicate the `Matchmaker/html/sample` directory as `Matchmaker/html/custom`.
2. Edit `Matchmaker/html/custom/queue/queue.html` as needed.

It is required to keep the same directory struture and file names for the template (`.html`) files. The Matchmaker server will prefer the `custom` directory over `sample`. The `custom` directory always needs to contain all templates from the `sample` directory.

The `custom` directory can contain additional files, which may be referenced in the template files with a path relative to `Matchmaker/html/custom`. For example, an image located as `Matchmaker/html/custom/images/1.png` could be referenced as `<img src="/images/1.png" alt="">` in a template (`.html`) file.
