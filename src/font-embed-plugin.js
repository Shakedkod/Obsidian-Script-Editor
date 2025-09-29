export const fontEmbedPlugin = {
    name: 'font-embed',
    setup(build)
    {
        build.onLoad({ filter: /\.(woff|woff2|ttf|otf)$/ }, async (args) =>
        {
            const fs = await import('fs/promises');
            const path = await import('path');

            try
            {
                const contents = await fs.readFile(args.path);
                const base64 = contents.toString('base64');
                const ext = path.extname(args.path).slice(1).toLowerCase();

                // Proper MIME type mapping
                const mimeTypes = {
                    'woff': 'font/woff',
                    'woff2': 'font/woff2',
                    'ttf': 'font/ttf',
                    'otf': 'font/otf'
                };

                const mimeType = mimeTypes[ext] || 'application/font-woff';
                const dataUri = `data:${mimeType};base64,${base64}`;

                return {
                    contents: `export default ${JSON.stringify(dataUri)};`,
                    loader: 'js',
                };
            } catch (error)
            {
                console.error('Error loading font:', error);
                return {
                    contents: 'export default "";',
                    loader: 'js',
                };
            }
        });
    },
};