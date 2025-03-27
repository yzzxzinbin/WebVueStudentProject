<template>
  <div class="login">
    <div class="container">
      <!-- 登录页系统名字 -->
      <h1>xxx管理系统</h1>
      <!-- 表单 -->
      <el-form
        :model="ruleForm"
        :rules="rules"
        ref="ruleForm"
        label-width="70px"
        class="demo-ruleForm"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="ruleForm.username"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="ruleForm.password"></el-input>
        </el-form-item>
        <el-form-item style="text-align: right">
          <el-button type="primary" @click="submitForm('ruleForm')"
            >登录</el-button
          >
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      // 表单数据
      ruleForm: {
        username: "",
        password: "",
      },
      // 表单验证规则
      rules: {
        username: [
          { required: true, message: "请输入用户名", trigger: "blur" },
        ],
        password: [
          { required: true, message: "请输入密码", trigger: "blur" },
          {
            min: 8,
            max: 12,
            message: "长度在 8 到 12 个字符",
            trigger: "blur",
          },
        ],
      },
    };
  },
  methods: {
    // 表单提交-登录
    submitForm(formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          // 存储token
          localStorage.setItem("token", 123);
          // 跳转到登录页
          this.$router.push({
            path: "/",
          });
          // 消息提示
          this.$message({
            message: '登录成功！',
            type: 'success'
          });
        } else {
          console.log("error submit!!");
          return false;
        }
      });
    },
  },
};
</script>

<style scoped>
.login {
  height: 100vh;
  /* background-color: lightblue; */
  background-image: url("../assets/images/3.png");
  background-size: 100% 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.login .container {
  width: 420px;
  /* height: 300px; */
  background-color: #ffffffb6;
  padding: 20px 40px;
  border-radius: 10px;
}
.login .container h1 {
  text-align: center;
  /* margin: 20px 0; */
  margin-bottom: 20px;
}
</style>
