module.exports = {
  apps: [
    {
      name: 'longpoll-microservice',
      cwd: __dirname,
      script: './dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      time: true,
      env: {
        NODE_ENV: 'production',
        DATABASE_URL: 'file:../../external-db/app.sqlite',
      },
      env_production: {
        NODE_ENV: 'production',
        DATABASE_URL: 'file:../../external-db/app.sqlite',
      },
    },
  ],
};
