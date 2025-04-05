const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true
})
module.exports = {
  css: {
    loaderOptions: {
      sass: {
        // 可选：全局注入变量/混合（所有 .vue 文件无需手动导入）
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  }
};