import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { resolve } from 'path'

export default defineConfig({
    resolve: {
        alias: {
            'alleo/service': resolve(__dirname, './node_modules/@withalleo/alleo-widget/dist/service.d.ts'),
            alleo: resolve(__dirname, './node_modules/@withalleo/alleo-widget/dist/widget.d.ts'),
            alleoWidgetUtils: resolve(__dirname, './node_modules/@withalleo/alleo-widget/dist/alleoWidgetUtils.ts'),
        },
    },
    plugins: [
        viteSingleFile(),
    ],
})
