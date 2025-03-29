<template>
    <div class="user">
        <el-card shadow="hover" class="search-card">
            <div class="search-group">
                <el-select v-model="selectedField" placeholder="选择字段" clearable class="field-select">
                    <el-option v-for="item in fields" :key="item.value" :label="item.label"
                        :value="item.value"></el-option>
                </el-select>
                <el-input v-model="searchQuery" placeholder="请输入搜索内容" class="search-box" clearable
                    @keyup.enter.native="handleSearch">
                    <el-button slot="append" icon="el-icon-search" @click="handleSearch"></el-button>
                </el-input>
                <el-button type="success" icon="el-icon-plus" @click="openAddDialog"
                    class="action-button">添加</el-button>
                <el-button type="primary" icon="el-icon-upload2" @click="importData"
                    class="action-button">导入</el-button>
                <el-button type="warning" icon="el-icon-download" @click="exportData"
                    class="action-button">导出</el-button>
            </div>
        </el-card>

        <el-card shadow="hover" class="table-card">
            <div class="table-header">
                <span class="table-title">学生信息列表</span>
                <el-tag type="info">共 {{ total }} 条记录</el-tag>
            </div>
            <el-table ref="table" :data="paginatedStudents" height=tableHeight  stripe highlight-current-row style="width: 100%"
                v-loading="loading" @sort-change="handleSortChange" @header-dragend="handleHeaderDragEnd">
                <el-table-column prop="id" label="学号" width="120" sortable></el-table-column>
                <el-table-column prop="name" label="姓名" width="100"></el-table-column>
                <el-table-column prop="class" label="班级" width="150"></el-table-column>
                <el-table-column prop="college" label="学院" width="180"></el-table-column>
                <el-table-column prop="duration" label="学制" width="100"></el-table-column>
                <el-table-column prop="dorm" label="宿舍号" width="120"></el-table-column>
                <el-table-column prop="phone" label="电话号码" width="150"></el-table-column>
                <el-table-column prop="age" label="年龄" width="100" sortable></el-table-column>
                <el-table-column prop="gender" label="性别" width="50"></el-table-column>
                <el-table-column prop="enrollmentDate" label="入校日期" width="150" sortable></el-table-column>
                <el-table-column label="操作" width="180" fixed="right" align="center" header-align="center">
                    <template slot-scope="scope">
                        <el-button size="mini" type="primary" @click="editStudent(scope.row)">修改</el-button>
                        <el-button size="mini" type="danger" @click="deleteStudent(scope.row.id)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
            <el-pagination class="pagination" @size-change="handleSizeChange" @current-change="handleCurrentChange"
                :current-page="currentPage" :page-sizes="[10, 20, 50, 100]" :page-size="pageSize"
                layout="total, sizes, prev, pager, next, jumper" :total="total"></el-pagination>
        </el-card>
        <!-- 修改学生信息弹框 -->
        <el-dialog title="修改学生信息" :visible.sync="editDialogVisible" width="650px" center>
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
                            <el-date-picker v-model="editForm.enrollmentDate" type="date" placeholder="选择日期"
                                value-format="yyyy-MM-dd"></el-date-picker>
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
        <el-dialog title="添加学生信息" :visible.sync="addDialogVisible" width="650px" modal-append-to-body>
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
                            <el-date-picker v-model="addForm.enrollmentDate" type="date" placeholder="选择日期"
                                value-format="yyyy-MM-dd"></el-date-picker>
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
    /**
     * 变量注解自动生成
     * @property {string} searchQuery - 用户输入的搜索内容，用于过滤学生列表。
     * @property {string} selectedField - 用户选择的过滤字段（例如：姓名、学号）。
     * @property {Array<Object>} fields - 可供选择的过滤字段列表，每项包含标签和对应的值。
     * @property {Array<Object>} students - 显示在表格中的学生数据列表。
     * @property {boolean} editDialogVisible - 控制编辑学生信息弹框的显示状态。
     * @property {Object} editForm - 编辑学生信息时的表单数据。
     * @property {boolean} addDialogVisible - 控制添加学生信息弹框的显示状态。
     * @property {Object} addForm - 添加学生信息时的表单数据，初始化为空值。
     * @property {number} currentPage - 分页组件的当前页码。
     * @property {number} pageSize - 分页组件每页显示的学生数量。
     * @property {number} total - 数据集中学生的总数。
     * @property {boolean} loading - 指示数据是否正在加载的动画（例如：API 调用期间）。
     */
    data() {
        return {
            searchQuery: '',
            selectedField: '',
            fields: [
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
            students: [],
            editDialogVisible: false,
            editForm: {},
            addDialogVisible: false,
            addForm: { id: '', name: '', class: '', college: '', duration: '', dorm: '', phone: '', age: '', gender: '', enrollmentDate: '' },
            currentPage: 1,
            pageSize: 10,
            total: 0,
            loading: false
        };
    },
    computed: {
        // 计算过滤后的学生列表
        filteredStudents() {
            if (!this.selectedField || !this.searchQuery) {
                return this.students;
            }
            return this.students.filter(student =>
                student[this.selectedField]?.toString().includes(this.searchQuery)
            );
        },
        // 计算分页后的学生列表
        paginatedStudents() {
            const start = (this.currentPage - 1) * this.pageSize;
            const end = start + this.pageSize;
            return this.filteredStudents.slice(start, end);
        }
    },
    methods: {
        // 加载学生信息
        loadStudents() {
            const savedStudents = localStorage.getItem('students');
            this.students = savedStudents ? JSON.parse(savedStudents) : [];
            this.total = this.students.length;
        },
        // 保存学生信息到 localStorage
        saveStudents() {
            localStorage.setItem('students', JSON.stringify(this.students));
            this.total = this.students.length;
        },
        // 搜索处理
        handleSearch() {
            this.currentPage = 1;
        },
        // 分页大小变化处理
        handleSizeChange(size) {
            this.pageSize = size;
            this.currentPage = 1;
        },
        // 分页处理
        handleCurrentChange(page) {
            this.currentPage = page;
        },
        // 排序处理
        handleSortChange({ prop, order }) {
            if (order === 'ascending') {
                this.students.sort((a, b) => (a[prop] > b[prop] ? 1 : -1));
            } else if (order === 'descending') {
                this.students.sort((a, b) => (a[prop] < b[prop] ? 1 : -1));
            }
        },
        // 导出数据
        exportData() {
            const dataStr = JSON.stringify(this.students, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'students.json';
            link.click();
            URL.revokeObjectURL(url);
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
        this.loadStudents();
    }
};
</script>

<style scoped>
/* 主容器样式 */
.user {
    padding: 8px;
    border-radius: 20% !important;
}

/* 搜索区域样式 */
.search-card {
    padding: 8px;
    border-radius: 8px;
    margin-bottom: 20px;
}

/* 搜索框组样式 - 包含选择框、输入框和操作按钮 */
.search-group {
    display: flex;
    align-items: center;
    gap: 10px;
    /* 元素间距 */
}

.field-select {
    width: 150px;
    /* 字段选择框固定宽度 */
}

.search-box {
    flex: 1;
    /* 搜索框占据剩余空间 */
}

.action-button {
    white-space: nowrap;
    /* 按钮文字不换行 */
}

/* 表格容器样式 */
.table-card {
    padding: 8px;
    padding-bottom: 0px;
    border-radius: 8px;
    overflow: hidden;
}

/* 表格头部样式 - 包含标题和统计标签 */
.table-header {
    padding: 16px;
    background: rgb(250, 250, 250);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.table-title {
    font-size: 18px;
    font-weight: bold;
}

/* 表格主体样式 */
.el-table {
    width: 100%;
    flex: 1;
    max-height: calc(99vh - 400px);
    /* 动态高度 */
    overflow-y: auto;
}

/* 分页样式 */
.pagination {
    margin-top: 20px;
    text-align: right;
}

/* 固定列特殊样式处理 */
.el-table__fixed-right {
    height: calc(100% - 2px) !important;
    border-radius: 0 8px 0 0;
}

.el-table__fixed-right::before {
    background-color: transparent !important;
}

/* 页面标题样式 (虽然模板中没有使用，但保留以防后续添加) */
.page-title {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 20px;
    color: #333;
}
</style>