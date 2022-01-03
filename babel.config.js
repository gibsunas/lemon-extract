const config = {
    presets: [
        [
            '@babel/preset-env',
            {
                plugins: [
                    ['@babel/plugin-transform-modules-commonjs', {
                        importInterop: 'strict'
                    }]
                ],
                targets: {
                    node: 'current'
                }
            }
        ]
    ]
};

export default config;
