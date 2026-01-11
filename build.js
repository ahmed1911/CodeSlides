const rollup = require('rollup');
const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const typescript = require('@rollup/plugin-typescript');
const terser = require('@rollup/plugin-terser');

async function build() {
  try {
    const bundle = await rollup.rollup({
      input: 'templates/src/main.ts',
      plugins: [
        resolve(),
        commonjs(),
        typescript({
          tsconfig: false,
          compilerOptions: {
            module: 'esnext',
            target: 'es2018',
            lib: ['dom', 'esnext'],
            allowSyntheticDefaultImports: true,
          },
          include: ['templates/src/**/*'],
        }),
        terser({
          compress: {
            drop_console: false,
            passes: 2,
          },
          mangle: {
            properties: false,
          },
        }),
      ],
      onwarn: (warning) => {
        if (warning.code === 'THIS_IS_UNDEFINED') return;
        console.warn(warning.message);
      },
    });

    await bundle.write({
      file: 'templates/dist/bundle.js',
      format: 'iife',
      name: 'CodeSlides',
      sourcemap: true,
    });

    console.log('Build complete!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
