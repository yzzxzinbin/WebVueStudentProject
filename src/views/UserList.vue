<template>
  <div class="user">
    <h1>学生页面</h1>
    <div class="search-container">
      <!-- 字段选择下拉菜单 -->
      <el-select v-model="selectedField" placeholder="选择字段" class="field-select">
        <el-option
          v-for="item in fields"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        ></el-option>
      </el-select>
      <!-- 搜索框 -->
      <el-input
        v-model="searchQuery"
        placeholder="请输入搜索内容"
        class="search-box"
      ></el-input>
      <!-- 搜索按钮 -->
      <el-button type="primary" @click="handleSearch">搜索</el-button>
      <!-- 添加按钮 -->
      <el-button type="success" @click="openAddDialog" class="add-button">添加</el-button>
      <!-- 导入按钮 -->
      <el-button type="primary" @click="importData" class="import-button">导入</el-button>
    </div>
    <!-- 学生数据表格 -->
    <el-table :data="filteredStudents" border style="width: 100%">
      <el-table-column prop="id" label="学号" width="120"></el-table-column>
      <el-table-column prop="name" label="姓名" width="100"></el-table-column>
      <el-table-column prop="class" label="班级" width="100"></el-table-column>
      <el-table-column prop="college" label="学院" width="180"></el-table-column>
      <el-table-column prop="duration" label="学制" width="100"></el-table-column>
      <el-table-column prop="dorm" label="宿舍号" width="120"></el-table-column>
      <el-table-column prop="phone" label="电话号码" width="150"></el-table-column>
      <el-table-column prop="age" label="年龄" width="50"></el-table-column>
      <el-table-column prop="gender" label="性别" width="50"></el-table-column>
      <el-table-column prop="enrollmentDate" label="入校日期" width="150"></el-table-column>
      <el-table-column label="操作" width="180">
        <template slot-scope="scope">
          <el-button size="mini" type="primary" @click="editStudent(scope.row)">修改</el-button>
          <el-button size="mini" type="danger" @click="deleteStudent(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 修改学生信息弹框 -->
    <el-dialog title="修改学生信息" :visible.sync="editDialogVisible" width="600px">
      <el-form :model="editForm" label-width="80px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学号">
              <el-input v-model="editForm.id" disabled></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="姓名">
              <el-input v-model="editForm.name"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="班级">
              <el-input v-model="editForm.class"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="性别">
              <el-select v-model="editForm.gender" placeholder="选择性别">
                <el-option label="男" value="男"></el-option>
                <el-option label="女" value="女"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="年龄">
              <el-input v-model="editForm.age" type="number"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学制">
              <el-input v-model="editForm.duration"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="宿舍号">
              <el-input v-model="editForm.dorm"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="入校日期">
              <el-date-picker v-model="editForm.enrollmentDate" type="date" placeholder="选择日期" value-format="yyyy-MM-dd"></el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="电话号码">
              <el-input v-model="editForm.phone"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </div>
    </el-dialog>
    <!-- 添加学生信息弹框 -->
    <el-dialog title="添加学生信息" :visible.sync="addDialogVisible" width="600px">
      <el-form :model="addForm" label-width="80px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学号">
              <el-input v-model="addForm.id"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="姓名">
              <el-input v-model="addForm.name"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="班级">
              <el-input v-model="addForm.class"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="性别">
              <el-select v-model="addForm.gender" placeholder="选择性别">
                <el-option label="男" value="男"></el-option>
                <el-option label="女" value="女"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="年龄">
              <el-input v-model="addForm.age" type="number"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学制">
              <el-input v-model="addForm.duration"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="宿舍号">
              <el-input v-model="addForm.dorm"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="入校日期">
              <el-date-picker v-model="addForm.enrollmentDate" type="date" placeholder="选择日期" value-format="yyyy-MM-dd"></el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="电话号码">
              <el-input v-model="addForm.phone"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveAdd">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  data() {
    return {
      searchQuery: '', // 搜索框绑定的数据
      selectedField: '', // 下拉菜单绑定的数据
      fields: [ // 可选字段
        { label: '姓名', value: 'name' },
        { label: '学号', value: 'id' },
        { label: '班级', value: 'class' },
        { label: '学院', value: 'college' },
        { label: '学制', value: 'duration' },
        { label: '宿舍号', value: 'dorm' },
        { label: '电话号码', value: 'phone' },
        { label: '年龄', value: 'age' },
        { label: '性别', value: 'gender' },
        { label: '入校日期', value: 'enrollmentDate' }
      ],
      students: [], // 学生数据
      editDialogVisible: false, // 控制弹框显示
      editForm: {}, // 当前编辑的学生信息
      addDialogVisible: false, // 控制添加弹框显示
      addForm: { id: '', name: '', class: '', college: '', duration: '', dorm: '', phone: '', age: '', gender: '', enrollmentDate: '' } // 添加学生信息表单
    };
  },
  computed: {
    filteredStudents() {
      if (!this.selectedField || !this.searchQuery) {
        return this.students;
      }
      return this.students.filter(student =>
        student[this.selectedField].toString().includes(this.searchQuery)
      );
    }
  },
  methods: {
    // 初始化学生数据
    loadStudents() {
      const savedStudents = localStorage.getItem('students');
      this.students = savedStudents ? JSON.parse(savedStudents) : [];
    },
    // 保存学生数据到 localStorage
    saveStudents() {
      localStorage.setItem('students', JSON.stringify(this.students));
    },
    // 搜索按钮点击事件
    handleSearch() {
      if (!this.selectedField) {
        this.$message.error('请选择字段');
        return;
      }
      console.log(`搜索字段: ${this.selectedField}, 搜索内容: ${this.searchQuery}`);
    },
    // 修改学生信息
    editStudent(student) {
      this.editForm = { ...student }; // 深拷贝学生信息
      this.editDialogVisible = true;
    },
    // 保存修改
    saveEdit() {
      const index = this.students.findIndex(student => student.id === this.editForm.id);
      if (index !== -1) {
        this.editForm.enrollmentDate = this.editForm.enrollmentDate || null; // 确保日期字段不为 undefined
        this.students.splice(index, 1, { ...this.editForm });
        this.saveStudents(); // 保存到 localStorage
        this.$message.success('修改成功');
      }
      this.editDialogVisible = false;
    },
    // 删除学生信息
    deleteStudent(id) {
      this.students = this.students.filter(student => student.id !== id);
      this.saveStudents(); // 保存到 localStorage
      this.$message.success('删除成功');
    },
    // 打开添加学生信息弹框
    openAddDialog() {
      this.addForm = { id: '', name: '', class: '', college: '', duration: '', dorm: '', phone: '', age: '', gender: '', enrollmentDate: '' };
      this.addDialogVisible = true;
    },
    // 保存添加的学生信息
    saveAdd() {
      if (!this.addForm.id || !this.addForm.name) {
        this.$message.error('请填写完整信息');
        return;
      }
      this.addForm.enrollmentDate = this.addForm.enrollmentDate || null; // 确保日期字段不为 undefined
      this.students.push({ ...this.addForm });
      this.saveStudents(); // 保存到 localStorage
      this.$message.success('添加成功');
      this.addDialogVisible = false;
    },
    // 导入数据
    importData() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const importedData = JSON.parse(e.target.result);
              if (Array.isArray(importedData)) {
                this.students = [...this.students, ...importedData];
                this.saveStudents(); // 保存到 localStorage
                this.$message.success('数据导入成功');
              } else {
                this.$message.error('文件格式错误');
              }
            } catch (error) {
              this.$message.error('文件解析失败');
            }
          };
          reader.readAsText(file);
        }
      };
      input.click();
    }
  },
  created() {
    this.loadStudents(); // 加载学生数据
  }
};
</script>

<style scoped>
.user {
  padding: 10px;
}
.search-container {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  margin-top: 20px; /* 增加与标题的间隔 */
}
.field-select {
  width: 150px;
  margin-right: 10px;
}
.search-box {
  flex: 1;
  margin-right: 10px;
}
.add-button {
  margin-left: 10px;
}
.import-button {
  margin-left: 10px;
}
.el-form-item {
  margin-bottom: 10px; /* 减少字段输入框之间的间隔 */
}
</style>