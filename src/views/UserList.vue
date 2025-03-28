<template>
    <div class="user">
        <div class="search-container">
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
        </div>

        <el-card shadow="hover" class="table-container">
            <div class="table-header">
                <span class="table-title">学生信息列表</span>
                <el-tag type="info">共 {{ total }} 条记录</el-tag>
            </div>

            <el-table ref="table" :data="paginatedStudents" border stripe highlight-current-row style="width: 100%"
                v-loading="loading" :height="tableHeight" @sort-change="handleSortChange"
                @header-dragend="handleHeaderDragEnd">

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
                layout="total, sizes, prev, pager, next, jumper" :total="total">
            </el-pagination>
        </el-card>

        <!-- 修改/添加对话框（保持原有代码不变） -->
        <!-- ... -->
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
            loading: false,
            tableHeight: 570
        };
    },
    computed: {
        filteredStudents() {
            if (!this.selectedField || !this.searchQuery) {
                return this.students;
            }
            return this.students.filter(student =>
                student[this.selectedField]?.toString().includes(this.searchQuery)
            );
        },
        paginatedStudents() {
            const start = (this.currentPage - 1) * this.pageSize;
            const end = start + this.pageSize;
            return this.filteredStudents.slice(start, end);
        }
    },
    methods: {
        loadStudents() {
            const savedStudents = localStorage.getItem('students');
            this.students = savedStudents ? JSON.parse(savedStudents) : [];
            this.total = this.students.length;
        },
        saveStudents() {
            localStorage.setItem('students', JSON.stringify(this.students));
            this.total = this.students.length;
        },
        calcTableHeight() {
            const windowHeight = window.innerHeight;
            this.tableHeight = windowHeight - 410; // 根据实际布局调整
        },
        handleHeaderDragEnd() {
            this.$nextTick(() => {
                this.$refs.table.doLayout();
            });
        },
        // 其他方法保持原有实现...
        loadStudents() {
            const savedStudents = localStorage.getItem('students');
            this.students = savedStudents ? JSON.parse(savedStudents) : [];
            this.total = this.students.length;
        },
        saveStudents() {
            localStorage.setItem('students', JSON.stringify(this.students));
            this.total = this.students.length;
        },
        handleSearch() {
            this.currentPage = 1;
        },
        handleSizeChange(size) {
            this.pageSize = size;
            this.currentPage = 1;
        },
        handleCurrentChange(page) {
            this.currentPage = page;
        },
        handleSortChange({ prop, order }) {
            if (order === 'ascending') {
                this.students.sort((a, b) => (a[prop] > b[prop] ? 1 : -1));
            } else if (order === 'descending') {
                this.students.sort((a, b) => (a[prop] < b[prop] ? 1 : -1));
            }
        },
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
    mounted() {
        this.loadStudents();
        this.calcTableHeight();
        window.addEventListener('resize', this.calcTableHeight);
        
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.calcTableHeight);
    },
    created() {
        this.loadStudents();
    }
};
</script>

<style scoped>
.user {
    padding: 8px;
}

.search-container {
    margin-bottom: 20px;
}

.search-card {
    padding: 12px;
    border-radius: 8px;
}

.search-group {
    display: flex;
    align-items: center;
    gap: 10px;
}

.el-card {
    background: rgb(250, 250, 250);
}

.field-select {
    width: 150px;
}

.search-box {
    flex: 1;
}

.action-button {
    white-space: nowrap;
}

/* 关键样式修改 */
.table-container {
    padding: 0;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.table-header {
    padding: 16px;
    background: #f6f7f7;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

/* 移除表格内边距 */
.el-table__body-wrapper {
    padding: 0 !important;
}

/* 调整固定列样式 */
.el-table__fixed-right {
    bottom: auto !important;
    top: 40px;
    /* 表头高度 */
    height: calc(100% - 40px) !important;
}

/* 隐藏多余的空白行 */
.el-table__empty-block {
    min-height: 0 !important;
}

.table-title {
    font-size: 18px;
    font-weight: bold;
}

.el-table {
    flex: 1;
}

/* 修复固定列样式 */
.el-table__fixed-right {
    height: calc(100% - 2px) !important;
    border-radius: 0 8px 0 0;
}

.el-table__fixed-right::before {
    background-color: transparent !important;
}

.pagination {
    padding: 16px;
    background: #f6f7f7;
    border-top: 1px solid #ebeef5;
}

/* 响应式调整 */
@media (max-width: 768px) {
    .search-group {
        flex-wrap: wrap;
    }

    .field-select,
    .search-box {
        width: 100%;
    }
}
</style>