<!-- 权限控制方面的接口还没有对接,暂时懒得写了 -->
<template>
  <div class="notification-sender">
    <!-- 顶部操作栏 - 重新设计包含用户选择功能 -->
    <el-card shadow="hover" class="top-bar">
      <div class="top-bar-content">
        <!-- 左侧：发送用户选择 -->
        <div class="recipient-selector">
          <el-radio-group v-model="notificationForm.recipientType" @change="handleRecipientTypeChange" size="small">
            <el-radio-button label="all">所有用户</el-radio-button>
            <el-radio-button label="specific">特定用户</el-radio-button>
          </el-radio-group>
          
          <el-select 
            v-if="notificationForm.recipientType === 'specific'" 
            v-model="notificationForm.recipients" 
            multiple 
            collapse-tags
            placeholder="选择用户" 
            filterable 
            class="user-select">
            <el-option v-for="user in users" :key="user.id" :label="user.name || user.username" :value="user.id">
              <div class="notify-user-option">
                <el-avatar :size="24" :src="getUserAvatar(user.id)"></el-avatar>
                <span class="notify-user-info">
                  <div class="notify-user-name">{{ user.name || user.username }}</div>
                </span>
                <el-tag :type="getRoleTagType(user.role)" size="mini" class="notify-role-tag">
                  {{ formatRole(user.role) }}
                </el-tag>
              </div>
            </el-option>
          </el-select>
        </div>

        <!-- 右侧：操作按钮 -->
        <div class="action-buttons">
          <el-button type="primary" icon="el-icon-s-promotion" @click="sendNotification">发送通知</el-button>
          <el-button icon="el-icon-view" @click="previewNotification">预览</el-button>
          <el-button icon="el-icon-delete" @click="resetForm">清空</el-button>
          <el-button type="info" icon="el-icon-message" @click="viewSentNotifications">查看已发送</el-button>
        </div>
      </div>
    </el-card>

    <!-- 主要内容区域 -->
    <div class="content-area">
      <!-- 左侧：消息编辑区 -->
      <div class="left-container">
        <!-- 消息编辑区 -->
        <el-card shadow="hover" class="message-editor">
          <h3 class="section-title">通知内容</h3>
          <el-form :model="notificationForm" ref="notificationForm" :rules="rules" label-width="100px">
            <!-- 消息标题 -->
            <el-form-item label="通知标题" prop="title">
              <el-input v-model="notificationForm.title" placeholder="请输入通知标题"></el-input>
            </el-form-item>

            <!-- 消息内容 - 减小高度 -->
            <el-form-item label="通知内容" prop="content">
              <el-input type="textarea" v-model="notificationForm.content" :rows="4" placeholder="请输入通知内容" resize="none"></el-input>
            </el-form-item>

            <!-- 将优先级和有效期放在同一行 -->
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="优先级">
                  <el-select v-model="notificationForm.priority" placeholder="请选择优先级" style="width: 100%">
                    <el-option label="低" value="low"></el-option>
                    <el-option label="中" value="medium"></el-option>
                    <el-option label="高" value="high"></el-option>
                    <el-option label="紧急" value="urgent"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="有效期">
                  <el-date-picker
                    v-model="notificationForm.expiry"
                    type="datetime"
                    placeholder="选择通知失效时间"
                    format="yyyy-MM-dd HH:mm"
                    value-format="yyyy-MM-dd HH:mm:ss"
                    style="width: 100%">
                  </el-date-picker>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-card>

        <!-- 附件和系统信息 - 改为水平并排布局 -->
        <el-card shadow="hover" class="addons-section">
          <div class="addons-container">
            <!-- 左侧：附件上传区域 -->
            <div class="attachment-section">
              <h3 class="section-title">附件</h3>
              <el-upload
                class="attachment-uploader"
                action="#"
                :http-request="handleFileUpload"
                :file-list="attachmentFiles"
                :on-remove="handleFileRemove"
                multiple
                :limit="5">
                <el-button size="small" type="primary" icon="el-icon-upload2">添加附件</el-button>
                <div slot="tip" class="el-upload__tip">最多5个附件，单个文件不超过10MB</div>
              </el-upload>
            </div>

            <!-- 右侧：系统信息选择区域 -->
            <div class="system-info-section">
              <h3 class="section-title">附加系统信息</h3>
              
              <!-- 系统信息类型选择 -->
              <el-tabs v-model="activeSystemInfoTab">
                <el-tab-pane label="操作日志" name="operations">
                  <el-select 
                    v-model="selectedSystemInfo.operations" 
                    multiple 
                    filterable 
                    placeholder="选择要附加的操作日志"
                    style="width: 100%">
                    <el-option 
                      v-for="log in operationLogs" 
                      :key="log.id" 
                      :label="`${log.id.substring(0, 10)}... (${log.type})`" 
                      :value="log.id">
                      <div class="info-option">
                        <el-tag :type="getOperationTagType(log.type)" size="mini">{{ log.type }}</el-tag>
                        <span>{{ formatDateTime(log.timestamp) }}</span>
                        <span class="text-ellipsis">ID: {{ log.id }}</span>
                      </div>
                    </el-option>
                  </el-select>
                </el-tab-pane>
                
                <el-tab-pane label="越权申请" name="overrides">
                  <el-select 
                    v-model="selectedSystemInfo.overrides" 
                    multiple 
                    filterable 
                    placeholder="选择要附加的越权申请"
                    style="width: 100%">
                    <el-option 
                      v-for="req in overrideRequests" 
                      :key="req.id" 
                      :label="`${req.id.substring(0, 10)}... (${getStatusText(req.status)})`" 
                      :value="req.id">
                      <div class="info-option">
                        <el-tag :type="getStatusTagType(req.status)" size="mini">{{ getStatusText(req.status) }}</el-tag>
                        <span>{{ formatDateTime(req.timestamp) }}</span>
                        <span class="text-ellipsis">{{ req.type }}: {{ req.productId }}</span>
                      </div>
                    </el-option>
                  </el-select>
                </el-tab-pane>
                
                <el-tab-pane label="仓库数据" name="warehouses">
                  <el-select 
                    v-model="selectedSystemInfo.warehouses" 
                    multiple 
                    filterable 
                    placeholder="选择要附加的仓库信息"
                    style="width: 100%">
                    <el-option 
                      v-for="warehouse in warehouses" 
                      :key="warehouse.id" 
                      :label="warehouse.name" 
                      :value="warehouse.id">
                      <div class="info-option">
                        <span class="warehouse-name">{{ warehouse.name }}</span>
                        <span class="warehouse-location">{{ warehouse.location }}</span>
                      </div>
                    </el-option>
                  </el-select>
                </el-tab-pane>
              </el-tabs>
              
              <!-- 已选系统信息预览 -->
              <div class="selected-info-preview" v-if="hasSelectedSystemInfo">
                <h4>已选系统信息</h4>
                <el-tag 
                  v-for="id in selectedSystemInfo.operations" 
                  :key="'op-'+id" 
                  closable
                  @close="removeSelectedInfo('operations', id)"
                  class="selected-tag">
                  操作日志 {{ id.substring(0, 8) }}...
                </el-tag>
                
                <el-tag 
                  v-for="id in selectedSystemInfo.overrides" 
                  :key="'ov-'+id" 
                  closable
                  @close="removeSelectedInfo('overrides', id)"
                  type="warning"
                  class="selected-tag">
                  越权申请 {{ id.substring(0, 8) }}...
                </el-tag>
                
                <el-tag 
                  v-for="id in selectedSystemInfo.warehouses" 
                  :key="'wh-'+id" 
                  closable
                  @close="removeSelectedInfo('warehouses', id)"
                  type="info"
                  class="selected-tag">
                  仓库 {{ getWarehouseName(id) }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 右侧：通知接收列表 -->
      <el-card shadow="hover" class="notification-list">
        <div class="list-header">
          <h3 class="section-title">最近通知</h3>
          <div class="list-actions">
            <el-radio-group v-model="notificationFilter" size="small">
              <el-radio-button label="all">全部</el-radio-button>
              <el-radio-button label="active">有效</el-radio-button>
              <el-radio-button label="expired">已过期</el-radio-button>
            </el-radio-group>
            <el-input
              placeholder="搜索通知"
              prefix-icon="el-icon-search"
              v-model="searchQuery"
              size="small"
              clearable
              class="search-input">
            </el-input>
          </div>
        </div>

        <div class="notification-timeline" v-if="filteredNotifications.length > 0">
          <div v-for="(notification, index) in filteredNotifications" 
               :key="notification.id" 
               class="timeline-item"
               :class="{'expanded': expandedNotification === notification.id}"
               @click="toggleNotificationExpand(notification.id)">
            
            <div class="timeline-dot" :class="getPriorityDotClass(notification.priority)"></div>
            
            <div class="timeline-card">
              <div class="card-header">
                <div class="card-title">
                  <h4>{{ notification.title }}</h4>
                  <el-tag size="mini" :type="getPriorityTagType(notification.priority)">
                    {{ getPriorityText(notification.priority) }}
                  </el-tag>
                </div>
                <div class="card-meta">
                  <span class="card-time">
                    <i class="el-icon-time"></i> {{ formatDateTimeShort(notification.timestamp) }}
                  </span>
                  <span class="card-status" :class="isExpired(notification) ? 'expired' : 'active'">
                    {{ isExpired(notification) ? '已失效' : '有效' }}
                  </span>
                </div>
              </div>
              
              <div class="card-recipients">
                <template v-if="notification.recipientType === 'all'">
                  <span class="all-recipients">所有用户</span>
                </template>
                <template v-else>
                  <el-avatar v-for="(id, i) in notification.recipients.slice(0, 3)" 
                            :key="id" 
                            :size="24" 
                            :src="getUserAvatar(id)"
                            class="recipient-avatar">
                  </el-avatar>
                  <span v-if="notification.recipients.length > 3" class="more-recipients">
                    +{{ notification.recipients.length - 3 }}
                  </span>
                </template>
              </div>
              
              <!-- 展开后显示的内容 -->
              <div class="card-content" v-if="expandedNotification === notification.id">
                <p>{{ notification.content }}</p>
                
                <div class="card-attachments" v-if="notification.attachments && notification.attachments.length > 0">
                  <h5><i class="el-icon-paperclip"></i> 附件</h5>
                  <div class="attachment-chips">
                    <div v-for="(attachment, idx) in notification.attachments" :key="idx" class="attachment-chip">
                      <i :class="getFileIcon(attachment.name)"></i>
                      <span>{{ attachment.name }}</span>
                    </div>
                  </div>
                </div>
                
                <div class="card-actions">
                  <el-button size="mini" type="text" @click.stop="viewNotificationDetail(notification)">
                    详细信息
                  </el-button>
                  <el-button size="mini" type="text" @click.stop="deleteNotification(notification.id)">
                    删除
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="empty-list" v-else>
          <i class="el-icon-message"></i>
          <p>暂无通知</p>
        </div>
      </el-card>
    </div>

    <!-- 预览对话框 -->
    <el-dialog title="通知预览" :visible.sync="previewVisible" width="60%" center class="modern-dialog"
      top="8vh">
      <div class="notification-preview">
        <div class="preview-header">
          <h2>{{ notificationForm.title || '无标题' }}</h2>
          <div class="preview-meta">
            <el-tag :type="getPriorityTagType(notificationForm.priority)">{{ getPriorityText(notificationForm.priority) }}</el-tag>
            <span class="preview-time">发送时间: {{ formatDateTime(new Date()) }}</span>
            <span v-if="notificationForm.expiry" class="preview-expiry">
              有效期至: {{ notificationForm.expiry }}
            </span>
          </div>
          <div class="preview-recipients">
            接收者: 
            <template v-if="notificationForm.recipientType === 'all'">
              <span class="all-users">所有用户</span>
            </template>
            <template v-else>
              <el-tag 
                v-for="id in notificationForm.recipients" 
                :key="id" 
                size="small"
                class="recipient-tag">
                {{ getUserName(id) }}
              </el-tag>
            </template>
          </div>
        </div>
        
        <div class="preview-content">
          <p v-if="notificationForm.content">{{ notificationForm.content }}</p>
          <p v-else class="empty-content">无内容</p>
        </div>
        
        <!-- 附件预览 -->
        <div class="preview-attachments detail-section" v-if="attachmentFiles.length > 0">
          <h3 class="section-title">附件 ({{ attachmentFiles.length }})</h3>
          <div class="attachment-list">
            <div v-for="(file, index) in attachmentFiles" :key="index" class="attachment-item">
              <i :class="getFileIcon(file.name)"></i>
              <span>{{ file.name }}</span>
              <span class="file-size">({{ formatFileSize(file.size) }})</span>
            </div>
          </div>
        </div>
        
        <!-- 系统信息预览 -->
        <div class="preview-system-info detail-section" v-if="hasSelectedSystemInfo">
          <h3 class="section-title">系统信息</h3>
          
          <div v-if="selectedSystemInfo.operations.length > 0">
            <h4>操作日志</h4>
            <ul class="info-list">
              <li v-for="id in selectedSystemInfo.operations" :key="id">
                {{ getOperationSummary(id) }}
              </li>
            </ul>
          </div>
          
          <div v-if="selectedSystemInfo.overrides.length > 0">
            <h4>越权申请</h4>
            <ul class="info-list">
              <li v-for="id in selectedSystemInfo.overrides" :key="id">
                {{ getOverrideSummary(id) }}
              </li>
            </ul>
          </div>
          
          <div v-if="selectedSystemInfo.warehouses.length > 0">
            <h4>仓库信息</h4>
            <ul class="info-list">
              <li v-for="id in selectedSystemInfo.warehouses" :key="id">
                {{ getWarehouseSummary(id) }}
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <span slot="footer" class="dialog-footer">
        <el-button @click="previewVisible = false">关闭</el-button>
        <el-button type="primary" @click="sendNotification">发送</el-button>
      </span>
    </el-dialog>

    <!-- 已发送通知对话框 -->
    <el-dialog title="已发送通知" :visible.sync="sentNotificationsVisible" width="80%" center>
      <el-table :data="sentNotifications" stripe style="width: 100%">
        <el-table-column prop="title" label="标题" min-width="180"></el-table-column>
        <el-table-column label="发送时间" width="180">
          <template slot-scope="scope">
            {{ formatDateTime(scope.row.timestamp) }}
          </template>
        </el-table-column>
        <el-table-column label="接收者" width="150">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.recipientType === 'all'" size="small">所有用户</el-tag>
            <el-tooltip v-else placement="top">
              <div slot="content">
                <div v-for="id in scope.row.recipients" :key="id">{{ getUserName(id) }}</div>
              </div>
              <el-tag size="small">{{ scope.row.recipients.length }}位用户</el-tag>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="100">
          <template slot-scope="scope">
            <el-tag :type="getPriorityTagType(scope.row.priority)">
              {{ getPriorityText(scope.row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="isExpired(scope.row) ? 'info' : 'success'">
              {{ isExpired(scope.row) ? '已失效' : '有效' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220">
          <template slot-scope="scope">
            <el-button size="mini" @click="viewNotificationDetail(scope.row)">查看</el-button>
            <el-button size="mini" type="danger" @click="deleteNotification(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 通知详情对话框 -->
    <el-dialog title="通知详情" :visible.sync="notificationDetailVisible" width="60%" center class="modern-dialog"
      top="8vh">
      <div class="notification-preview" v-if="currentNotification">
        <div class="preview-header">
          <h2>{{ currentNotification.title }}</h2>
          <div class="preview-meta">
            <el-tag :type="getPriorityTagType(currentNotification.priority)">
              {{ getPriorityText(currentNotification.priority) }}
            </el-tag>
            <span class="preview-time">发送时间: {{ formatDateTime(currentNotification.timestamp) }}</span>
            <span v-if="currentNotification.expiry" class="preview-expiry">
              有效期至: {{ currentNotification.expiry }}
            </span>
          </div>
          <div class="preview-recipients">
            接收者: 
            <template v-if="currentNotification.recipientType === 'all'">
              <span class="all-users">所有用户</span>
            </template>
            <template v-else>
              <el-tag 
                v-for="id in currentNotification.recipients" 
                :key="id" 
                size="small"
                class="recipient-tag">
                {{ getUserName(id) }}
              </el-tag>
            </template>
          </div>
        </div>
        
        <div class="preview-content">
          {{ currentNotification.content }}
        </div>
        
        <!-- 附件列表 -->
        <div class="preview-attachments detail-section" v-if="currentNotification.attachments && currentNotification.attachments.length > 0">
          <h3 class="section-title">附件 ({{ currentNotification.attachments.length }})</h3>
          <div class="attachment-list">
            <div v-for="(attachment, index) in currentNotification.attachments" :key="index" class="attachment-item">
              <i :class="getFileIcon(attachment.name)"></i>
              <span>{{ attachment.name }}</span>
              <span class="file-size">({{ formatFileSize(attachment.size) }})</span>
              <el-button size="mini" type="text" @click="downloadAttachment(attachment)">下载</el-button>
            </div>
          </div>
        </div>
        
        <!-- 系统信息 -->
        <div class="preview-system-info detail-section" v-if="hasSystemInfo(currentNotification)">
          <h3 class="section-title">系统信息</h3>
          
          <div v-if="currentNotification.systemInfo.operations && currentNotification.systemInfo.operations.length > 0">
            <h4>操作日志</h4>
            <ul class="info-list">
              <li v-for="id in currentNotification.systemInfo.operations" :key="id">
                {{ getOperationSummary(id) }}
              </li>
            </ul>
          </div>
          
          <div v-if="currentNotification.systemInfo.overrides && currentNotification.systemInfo.overrides.length > 0">
            <h4>越权申请</h4>
            <ul class="info-list">
              <li v-for="id in currentNotification.systemInfo.overrides" :key="id">
                {{ getOverrideSummary(id) }}
              </li>
            </ul>
          </div>
          
          <div v-if="currentNotification.systemInfo.warehouses && currentNotification.systemInfo.warehouses.length > 0">
            <h4>仓库信息</h4>
            <ul class="info-list">
              <li v-for="id in currentNotification.systemInfo.warehouses" :key="id">
                {{ getWarehouseSummary(id) }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'NotificationSender',
  data() {
    return {
      // IndexedDB 相关
      db: null,
      avatarDB: null,
      userAvatars: {}, // 存储用户头像的缓存
      
      // 通知表单
      notificationForm: {
        recipientType: 'all',
        recipients: [],
        title: '',
        content: '',
        priority: 'medium',
        expiry: null
      },
      
      // 通知接收列表相关
      notificationFilter: 'all',
      searchQuery: '',
      expandedNotification: null,
      
      // 表单验证规则
      rules: {
        title: [{ required: true, message: '请输入通知标题', trigger: 'blur' }],
        content: [{ required: true, message: '请输入通知内容', trigger: 'blur' }],
        recipients: [{ 
          type: 'array',
          required: true, 
          message: '请至少选择一位接收者', 
          trigger: 'change',
          validator: (rule, value, callback) => {
            if (this.notificationForm.recipientType === 'specific' && (!value || value.length === 0)) {
              callback(new Error('请至少选择一位接收者'));
            } else {
              callback();
            }
          }
        }]
      },
      
      // 附件相关
      attachmentFiles: [],
      
      // 系统信息相关
      activeSystemInfoTab: 'operations',
      selectedSystemInfo: {
        operations: [],
        overrides: [],
        warehouses: []
      },
      
      // 对话框控制
      previewVisible: false,
      sentNotificationsVisible: false,
      notificationDetailVisible: false,
      
      // 数据集合
      users: [],
      warehouses: [],
      operationLogs: [],
      overrideRequests: [],
      sentNotifications: [],
      currentNotification: null
    };
  },
  
  computed: {
    /**
     * @Function_Para 是否有选择的系统信息
     *   无参数
     * @Function_Meth 检查是否至少选择了一个系统信息
     */
    hasSelectedSystemInfo() {
      return this.selectedSystemInfo.operations.length > 0 ||
             this.selectedSystemInfo.overrides.length > 0 ||
             this.selectedSystemInfo.warehouses.length > 0;
    },
    
    /**
     * @Function_Para 过滤后的通知列表
     *   无参数
     * @Function_Meth 根据过滤条件和搜索查询过滤通知
     */
    filteredNotifications() {
      return this.sentNotifications.filter(notification => {
        // 状态过滤
        if (this.notificationFilter === 'active' && this.isExpired(notification)) {
          return false;
        }
        if (this.notificationFilter === 'expired' && !this.isExpired(notification)) {
          return false;
        }
        
        // 搜索过滤
        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase();
          return notification.title.toLowerCase().includes(query) || 
                 notification.content.toLowerCase().includes(query);
        }
        
        return true;
      });
    }
  },
  
  methods: {
    /**
     * @Function_Para 初始化IndexedDB
     *   无参数
     * @Function_Meth 创建或打开IndexedDB数据库，用于存储附件
     */
    async initIndexedDB() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('NotificationsDB', 1);
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          
          // 创建附件存储
          if (!db.objectStoreNames.contains('attachments')) {
            db.createObjectStore('attachments', { keyPath: 'id', autoIncrement: true });
          }
        };
        
        request.onsuccess = (event) => {
          this.db = event.target.result;
          console.log('通知数据库初始化成功');
          resolve();
        };
        
        request.onerror = (event) => {
          console.error('通知数据库初始化失败:', event.target.error);
          reject(event.target.error);
        };
      });
    },
    
    /**
     * @Function_Para 初始化头像数据库
     *   无参数
     * @Function_Meth 创建或打开IndexedDB数据库，用于读取用户头像
     */
    async initAvatarDB() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('AvatarDB', 1);
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('avatars')) {
            db.createObjectStore('avatars', { keyPath: 'userId' });
          }
        };
        
        request.onsuccess = (event) => {
          this.avatarDB = event.target.result;
          console.log('头像数据库初始化成功');
          resolve(this.avatarDB);
        };
        
        request.onerror = (event) => {
          console.error('头像数据库初始化失败:', event.target.error);
          reject(event.target.error);
        };
      });
    },
    
    /**
     * @Function_Para 处理附件上传
     *   @param {Object} options - 上传选项，包含文件信息
     * @Function_Meth 处理文件上传，存储文件到IndexedDB
     */
    async handleFileUpload(options) {
      const file = options.file;
      
      // 检查文件大小限制 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.$message.error(`文件 ${file.name} 超过10MB大小限制`);
        return;
      }
      
      // 读取文件内容为ArrayBuffer
      const arrayBuffer = await this.readFileAsArrayBuffer(file);
      
      // 生成唯一ID
      const fileId = Date.now() + '_' + Math.floor(Math.random() * 10000);
      
      // 添加到附件列表（用于UI显示）
      this.attachmentFiles.push({
        name: file.name,
        size: file.size,
        type: file.type,
        id: fileId,
        file: file  // 保存原始文件对象
      });
      
      // 存储到IndexedDB
      this.storeAttachment({
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        data: arrayBuffer,
        uploadTime: new Date().getTime()
      });
    },
    
    /**
     * @Function_Para 读取文件为ArrayBuffer
     *   @param {File} file - 文件对象
     * @Function_Meth 将文件内容读取为ArrayBuffer
     */
    readFileAsArrayBuffer(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e.target.error);
        reader.readAsArrayBuffer(file);
      });
    },
    
    /**
     * @Function_Para 存储附件到IndexedDB
     *   @param {Object} attachment - 附件对象
     * @Function_Meth 将附件数据存储到IndexedDB中
     */
    storeAttachment(attachment) {
      if (!this.db) {
        console.error('数据库未初始化');
        return;
      }
      
      const transaction = this.db.transaction(['attachments'], 'readwrite');
      const store = transaction.objectStore('attachments');
      
      const request = store.add(attachment);
      
      request.onsuccess = () => {
        console.log('附件存储成功，ID:', request.result);
      };
      
      request.onerror = (event) => {
        console.error('附件存储失败:', event.target.error);
        this.$message.error(`附件 ${attachment.name} 存储失败`);
      };
    },
    
    /**
     * @Function_Para 处理文件移除
     *   @param {Object} file - 被移除的文件信息
     * @Function_Meth 从附件列表和IndexedDB中移除文件
     */
    handleFileRemove(file) {
      // 从UI列表中移除
      this.attachmentFiles = this.attachmentFiles.filter(f => f.id !== file.id);
      
      // 如果有ID，从IndexedDB中移除
      if (file.id && this.db) {
        const transaction = this.db.transaction(['attachments'], 'readwrite');
        const store = transaction.objectStore('attachments');
        store.delete(file.id);
      }
    },
    
    /**
     * @Function_Para 格式化文件大小
     *   @param {Number} size - 文件大小（字节）
     * @Function_Meth 将文件大小转换为人类可读格式
     */
    formatFileSize(size) {
      if (size < 1024) {
        return size + 'B';
      } else if (size < 1024 * 1024) {
        return (size / 1024).toFixed(1) + 'KB';
      } else if (size < 1024 * 1024 * 1024) {
        return (size / (1024 * 1024)).toFixed(1) + 'MB';
      } else {
        return (size / (1024 * 1024 * 1024)).toFixed(1) + 'GB';
      }
    },
    
    /**
     * @Function_Para 获取文件图标
     *   @param {String} fileName - 文件名
     * @Function_Meth 根据文件扩展名返回对应的图标类
     */
    getFileIcon(fileName) {
      const ext = fileName.split('.').pop().toLowerCase();
      
      const iconMap = {
        pdf: 'el-icon-document',
        doc: 'el-icon-document-checked',
        docx: 'el-icon-document-checked',
        xls: 'el-icon-document',
        xlsx: 'el-icon-document',
        ppt: 'el-icon-document',
        pptx: 'el-icon-document',
        jpg: 'el-icon-picture-outline',
        jpeg: 'el-icon-picture-outline',
        png: 'el-icon-picture-outline',
        gif: 'el-icon-picture-outline',
        zip: 'el-icon-folder',
        rar: 'el-icon-folder',
        '7z': 'el-icon-folder',
        txt: 'el-icon-document',
      };
      
      return iconMap[ext] || 'el-icon-document';
    },
    
    /**
     * @Function_Para 移除已选系统信息
     *   @param {String} type - 信息类型
     *   @param {String} id - 信息ID
     * @Function_Meth 从已选系统信息中移除指定项
     */
    removeSelectedInfo(type, id) {
      this.selectedSystemInfo[type] = this.selectedSystemInfo[type].filter(item => item !== id);
    },
    
    /**
     * @Function_Para 处理接收者类型变化
     *   无参数
     * @Function_Meth 处理接收者类型变化，清空特定用户选择
     */
    handleRecipientTypeChange() {
      if (this.notificationForm.recipientType === 'all') {
        this.notificationForm.recipients = [];
      }
    },
    
    /**
     * @Function_Para 预览通知
     *   无参数
     * @Function_Meth 验证表单并显示通知预览对话框
     */
    previewNotification() {
      this.$refs.notificationForm.validate(valid => {
        if (valid) {
          this.previewVisible = true;
        } else {
          this.$message.error('请完善通知信息');
        }
      });
    },
    
    /**
     * @Function_Para 发送通知
     *   无参数
     * @Function_Meth 验证表单并发送通知
     */
    async sendNotification() {
      this.$refs.notificationForm.validate(async valid => {
        if (valid) {
          try {
            // 准备附件信息
            const attachments = await Promise.all(this.attachmentFiles.map(async file => {
              if (file.id) {
                // 获取存储在IndexedDB中的附件信息
                return {
                  id: file.id,
                  name: file.name,
                  size: file.size,
                  type: file.type
                };
              } else {
                return {
                  name: file.name,
                  size: file.size,
                  type: file.type
                };
              }
            }));
            
            // 创建通知对象
            const notification = {
              id: 'notif_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
              title: this.notificationForm.title,
              content: this.notificationForm.content,
              recipientType: this.notificationForm.recipientType,
              recipients: this.notificationForm.recipientType === 'specific' 
                          ? this.notificationForm.recipients 
                          : [],
              priority: this.notificationForm.priority,
              expiry: this.notificationForm.expiry,
              timestamp: new Date().toISOString(),
              sender: JSON.parse(localStorage.getItem('user')).id,
              systemInfo: this.selectedSystemInfo,
              attachments: attachments
            };
            
            // 保存通知到localStorage
            const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
            notifications.push(notification);
            localStorage.setItem('notifications', JSON.stringify(notifications));
            
            // 更新本地通知列表
            this.sentNotifications = notifications;
            
            this.$message.success('通知发送成功');
            this.previewVisible = false;
            this.resetForm();
            
          } catch (error) {
            console.error('发送通知时出错:', error);
            this.$message.error('发送通知失败：' + error.message);
          }
        } else {
          this.$message.error('请完善通知信息');
        }
      });
    },
    
    /**
     * @Function_Para 重置表单
     *   无参数
     * @Function_Meth 清空所有表单字段和附件
     */
    resetForm() {
      this.$refs.notificationForm.resetFields();
      this.notificationForm = {
        recipientType: 'all',
        recipients: [],
        title: '',
        content: '',
        priority: 'medium',
        expiry: null
      };
      
      // 清空附件
      this.attachmentFiles = [];
      
      // 清空系统信息
      this.selectedSystemInfo = {
        operations: [],
        overrides: [],
        warehouses: []
      };
    },
    
    /**
     * @Function_Para 查看已发送通知
     *   无参数
     * @Function_Meth 显示已发送通知列表对话框
     */
    viewSentNotifications() {
      this.loadSentNotifications();
      this.sentNotificationsVisible = true;
    },
    
    /**
     * @Function_Para 加载已发送通知
     *   无参数
     * @Function_Meth 从localStorage加载已发送的通知
     */
    loadSentNotifications() {
      const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      this.sentNotifications = notifications.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
    },
    
    /**
     * @Function_Para 查看通知详情
     *   @param {Object} notification - 通知对象
     * @Function_Meth 显示通知详情对话框
     */
    viewNotificationDetail(notification) {
      this.currentNotification = notification;
      this.notificationDetailVisible = true;
    },
    
    /**
     * @Function_Para 删除通知
     *   @param {String} id - 通知ID
     * @Function_Meth 从系统中删除指定通知
     */
    deleteNotification(id) {
      this.$confirm('确认删除此通知吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        const updatedNotifications = notifications.filter(n => n.id !== id);
        localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
        
        // 更新本地数据
        this.sentNotifications = this.sentNotifications.filter(n => n.id !== id);
        
        this.$message.success('通知已删除');
      }).catch(() => {});
    },
    
    /**
     * @Function_Para 下载附件
     *   @param {Object} attachment - 附件信息
     * @Function_Meth 从IndexedDB获取附件数据并下载
     */
    async downloadAttachment(attachment) {
      if (!this.db || !attachment.id) {
        this.$message.warning('无法下载此附件');
        return;
      }
      
      try {
        const transaction = this.db.transaction(['attachments'], 'readonly');
        const store = transaction.objectStore('attachments');
        
        const request = store.get(attachment.id);
        
        request.onsuccess = (event) => {
          const attachmentData = event.target.result;
          
          if (attachmentData && attachmentData.data) {
            // 创建Blob
            const blob = new Blob([attachmentData.data], { type: attachment.type || 'application/octet-stream' });
            
            // 创建下载链接
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = attachment.name;
            a.click();
            
            // 清理
            URL.revokeObjectURL(url);
          } else {
            this.$message.warning('附件数据不存在或已损坏');
          }
        };
        
        request.onerror = () => {
          this.$message.error('下载附件失败');
        };
      } catch (error) {
        console.error('下载附件时出错:', error);
        this.$message.error('下载附件失败: ' + error.message);
      }
    },
    
    /**
     * @Function_Para 判断是否过期
     *   @param {Object} notification - 通知对象
     * @Function_Meth 检查通知是否已过期
     */
    isExpired(notification) {
      if (!notification.expiry) return false;
      
      const expiryDate = new Date(notification.expiry);
      const now = new Date();
      
      return expiryDate < now;
    },
    
    /**
     * @Function_Para 加载用户数据
     *   无参数
     * @Function_Meth 从localStorage加载所有用户数据，并预加载用户头像
     */
    async loadUsers() {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      this.users = users.filter(user => user.status === 'active');
      
      // 预加载用户头像
      if (this.avatarDB) {
        for (const user of this.users) {
          if (!this.userAvatars[user.id]) {
            const avatar = await this.getAvatarFromDB(user.id);
            if (avatar) {
              this.$set(this.userAvatars, user.id, avatar);
            }
          }
        }
      }
    },
    
    /**
     * @Function_Para 加载仓库数据
     *   无参数
     * @Function_Meth 从localStorage加载所有仓库数据
     */
    loadWarehouses() {
      this.warehouses = JSON.parse(localStorage.getItem('warehouses') || '[]');
    },
    
    /**
     * @Function_Para 加载操作日志
     *   无参数
     * @Function_Meth 从localStorage加载操作日志数据
     */
    loadOperationLogs() {
      const logs = JSON.parse(localStorage.getItem('operations') || '[]');
      // 最新的日志优先显示
      this.operationLogs = logs.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      ).slice(0, 50); // 限制加载最近的50条记录
    },
    
    /**
     * @Function_Para 加载越权申请
     *   无参数
     * @Function_Meth 从localStorage加载越权申请数据
     */
    loadOverrideRequests() {
      const requests = JSON.parse(localStorage.getItem('pendingRequests') || '[]');
      // 最新的申请优先显示
      this.overrideRequests = requests.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      ).slice(0, 50); // 限制加载最近的50条记录
    },
    
    /**
     * @Function_Para 获取仓库名称
     *   @param {String} id - 仓库ID
     * @Function_Meth 根据仓库ID返回仓库名称
     */
    getWarehouseName(id) {
      const warehouse = this.warehouses.find(w => w.id === id);
      return warehouse ? warehouse.name : id;
    },
    
    /**
     * @Function_Para 获取用户名称
     *   @param {String} id - 用户ID
     * @Function_Meth 根据用户ID返回用户名称
     */
    getUserName(id) {
      const user = this.users.find(u => u.id === id);
      return user ? (user.name || user.username) : id;
    },
    
    /**
     * @Function_Para 格式化用户角色
     *   @param {String} role - 角色代码
     * @Function_Meth 将角色代码转换为中文显示
     */
    formatRole(role) {
      const roleMap = {
        'admin': '管理员',
        'manager': '经理',
        'operator': '操作员'
      };
      return roleMap[role] || role;
    },
    
    /**
     * @Function_Para 获取优先级标签类型
     *   @param {String} priority - 优先级
     * @Function_Meth 根据优先级返回对应的标签类型
     */
    getPriorityTagType(priority) {
      const typeMap = {
        low: 'info',
        medium: '',
        high: 'warning',
        urgent: 'danger'
      };
      return typeMap[priority] || '';
    },
    
    /**
     * @Function_Para 获取优先级文本
     *   @param {String} priority - 优先级
     * @Function_Meth 将优先级代码转换为中文显示
     */
    getPriorityText(priority) {
      const textMap = {
        low: '低',
        medium: '中',
        high: '高',
        urgent: '紧急'
      };
      return textMap[priority] || priority;
    },
    
    /**
     * @Function_Para 获取操作类型标签样式
     *   @param {String} type - 操作类型
     * @Function_Meth 根据操作类型返回对应的标签样式
     */
    getOperationTagType(type) {
      const typeMap = {
        '入库': 'success',
        '出库': 'danger',
        '转调': 'warning'
      };
      return typeMap[type] || 'info';
    },
    
    /**
     * @Function_Para 获取状态标签样式
     *   @param {String} status - 状态代码
     * @Function_Meth 根据状态代码返回对应的标签样式
     */
    getStatusTagType(status) {
      const statusMap = {
        'AWA': 'warning',   // 等待中
        'EXC': 'success',   // 已执行
        'REG': 'danger',    // 已拒绝
        'CNE': 'info'       // 已撤销
      };
      return statusMap[status] || 'info';
    },
    
    /**
     * @Function_Para 获取状态文本
     *   @param {String} status - 状态代码
     * @Function_Meth 根据状态代码返回中文状态描述
     */
    getStatusText(status) {
      const statusMap = {
        'AWA': '等待中',
        'EXC': '已执行',
        'REG': '已拒绝',
        'CNE': '已撤销'
      };
      return statusMap[status] || status;
    },
    
    /**
     * @Function_Para 格式化日期时间
     *   @param {String|Date} dateStr - 日期字符串或Date对象
     * @Function_Meth 将日期格式化为可读字符串
     */
    formatDateTime(dateStr) {
      if (!dateStr) return '';
      
      const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
      
      // 格式化为 YYYY-MM-DD HH:mm:ss
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },
    
    /**
     * @Function_Para 获取操作日志摘要
     *   @param {String} id - 操作日志ID
     * @Function_Meth 根据ID查找并返回操作日志摘要信息
     */
    getOperationSummary(id) {
      const log = this.operationLogs.find(log => log.id === id);
      
      if (!log) return `操作 ${id} (数据不存在)`;
      
      return `${log.type} 操作(${this.formatDateTime(log.timestamp)}): 商品${log.productId}, 数量${log.quantity}, 操作人: ${log.applicant}`;
    },
    
    /**
     * @Function_Para 获取越权申请摘要
     *   @param {String} id - 越权申请ID
     * @Function_Meth 根据ID查找并返回越权申请摘要信息
     */
    getOverrideSummary(id) {
      const request = this.overrideRequests.find(req => req.id === id);
      
      if (!request) return `越权申请 ${id} (数据不存在)`;
      
      return `${request.type} 越权申请(${this.getStatusText(request.status)}): 商品${request.productId}, 数量${request.quantity}, 申请人: ${request.applicant}`;
    },
    
    /**
     * @Function_Para 获取仓库摘要
     *   @param {String} id - 仓库ID
     * @Function_Meth 根据ID查找并返回仓库摘要信息
     */
    getWarehouseSummary(id) {
      const warehouse = this.warehouses.find(w => w.id === id);
      
      if (!warehouse) return `仓库 ${id} (数据不存在)`;
      
      return `仓库: ${warehouse.name}, 位置: ${warehouse.location || '未知'}`;
    },
    
    /**
     * @Function_Para 检查通知是否包含系统信息
     *   @param {Object} notification - 通知对象
     * @Function_Meth 检查通知是否包含任何系统信息
     */
    hasSystemInfo(notification) {
      if (!notification || !notification.systemInfo) return false;
      
      const info = notification.systemInfo;
      return (info.operations && info.operations.length > 0) ||
             (info.overrides && info.overrides.length > 0) ||
             (info.warehouses && info.warehouses.length > 0);
    },
    
    /**
     * @Function_Para 从数据库读取头像
     *   @param {string} userId - 用户ID
     * @Function_Meth 从IndexedDB检索指定用户的头像数据
     */
    async getAvatarFromDB(userId) {
      if (!this.avatarDB) return null;
      
      return new Promise((resolve) => {
        const transaction = this.avatarDB.transaction(['avatars'], 'readonly');
        const store = transaction.objectStore('avatars');
        
        const request = store.get(userId);
        
        request.onsuccess = () => {
          const result = request.result ? request.result.avatarData : null;
          // 缓存结果
          if (result) {
            this.userAvatars[userId] = result;
          }
          resolve(result);
        };
        
        request.onerror = () => {
          console.error('获取头像失败:', userId);
          resolve(null);
        };
      });
    },
    
    /**
     * @Function_Para 获取用户头像
     *   @param {string} userId - 用户ID
     * @Function_Meth 获取用户头像，优先从缓存读取，无缓存则从数据库读取
     */
    getUserAvatar(userId) {
      // 先查看缓存
      if (this.userAvatars[userId]) {
        return this.userAvatars[userId];
      }
      
      // 如果没有缓存，异步加载并更新缓存
      this.getAvatarFromDB(userId).then(avatarData => {
        if (avatarData) {
          this.$set(this.userAvatars, userId, avatarData);
        }
      });
      
      // 返回默认头像
      return require('@/assets/default-avatar.svg');
    },
    
    /**
     * @Function_Para 获取角色标签类型
     *   @param {String} role - 用户角色
     * @Function_Meth 根据用户角色返回对应的标签样式类型
     */
    getRoleTagType(role) {
      return role === 'admin' ? 'danger' :
             role === 'manager' ? 'warning' : 'success';
    },
    
    /**
     * @Function_Para 切换通知展开状态
     *   @param {String} id - 通知ID
     * @Function_Meth 展开或折叠通知详情
     */
    toggleNotificationExpand(id) {
      if (this.expandedNotification === id) {
        this.expandedNotification = null;
      } else {
        this.expandedNotification = id;
      }
    },
    
    /**
     * @Function_Para 获取优先级点的样式类
     *   @param {String} priority - 优先级
     * @Function_Meth 根据优先级返回对应的样式类
     */
    getPriorityDotClass(priority) {
      return {
        'dot-urgent': priority === 'urgent',
        'dot-high': priority === 'high',
        'dot-medium': priority === 'medium',
        'dot-low': priority === 'low'
      };
    },
    
    /**
     * @Function_Para 格式化短日期时间
     *   @param {String|Date} dateStr - 日期字符串或Date对象
     * @Function_Meth 将日期格式化为短格式字符串
     */
    formatDateTimeShort(dateStr) {
      if (!dateStr) return '';
      
      const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
      const now = new Date();
      const diff = Math.floor((now - date) / 1000); // 时间差（秒）
      
      // 今天的日期只显示时间
      if (date.toDateString() === now.toDateString()) {
        return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      }
      
      // 昨天只显示"昨天"和时间
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      }
      
      // 其他日期显示年月日
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    }
  },
  
  /**
   * @Function_Para 组件创建生命周期钩子
   * @Function_Meth 初始化组件:
   *   1. 初始化IndexedDB
   *   2. 加载各类数据
   */
  async created() {
    // 引入组件共享样式
    require('@/assets/style/components.css');
    
    try {
      // 并行初始化两个数据库
      await Promise.all([
        this.initIndexedDB(),
        this.initAvatarDB()
      ]);
    } catch (error) {
      console.error('数据库初始化失败:', error);
      this.$message.warning('附件存储功能初始化失败，可能无法上传附件');
    }
    
    // 加载所有必要数据
    await this.loadUsers();
    this.loadWarehouses();
    this.loadOperationLogs();
    this.loadOverrideRequests();
    this.loadSentNotifications();
  },
  
  /**
   * @Function_Para 组件销毁前钩子
   * @Function_Meth 组件销毁前清理资源
   */
  beforeDestroy() {
    // 关闭数据库连接
    if (this.db) {
      this.db.close();
    }
    if (this.avatarDB) {
      this.avatarDB.close();
    }
  }
};
</script>

<style scoped>
/* 页面布局样式 */
.notification-sender {
  padding: 12px;
  padding-bottom: 0px;
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

/* 顶部操作栏样式 - 重新设计 */
.top-bar {
  margin-bottom: 12px;
  padding: 12px 20px;
  background-color: rgb(245, 245, 250);
  border-radius: 12px;
}

.top-bar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 用户选择区域样式 */
.recipient-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-select {
  width: 300px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

/* 内容区域布局 */
.content-area {
  display: flex;
  flex-grow: 1;
  gap: 16px;
  height: calc(100% - 30px);
  overflow: hidden;
}

/* 消息编辑区样式 */
.message-editor {
  min-height: 43%;
  padding: 0px;
  border-radius: 12px;
  background-color: rgb(245, 245, 250);
}

/* 附件和系统信息区域 - 水平布局 */
.addons-section {
  padding: 0px;
  border-radius: 12px;
  background-color: rgb(245, 245, 250);
  /* 固定高度，与右侧卡片保持一致 */
  height: calc(100% - 280px); /* 减去消息编辑区和间距的高度 */
  overflow: hidden;
}

.addons-container {
  display: flex;
  gap: 24px;
  height: 100%;
}

/* 附件区域样式 */
.attachment-section {
  flex: 0.8;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.attachment-uploader {
  width: 100%;
  overflow-y: auto;
  max-height: calc(100% - 40px);
}

/* 上传列表滚动容器 */
.attachment-uploader>>>.el-upload-list {
  max-height: calc(100% - 60px); /* 减去按钮和提示的高度 */
  overflow-y: auto;
}

/* 系统信息区域样式 */
.system-info-section {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  max-height: 100%;
  padding-bottom: 2px;
}

/* 选项卡内容区域 - 移除滚动，超出部分隐藏 */
.system-info-section>>>.el-tabs__content {
  overflow: hidden;
  max-height: 150px;
}

/* 限制 el-select 多选框的高度 */
.system-info-section>>>.el-select {
  width: 60%;
}

/* 限制已选项显示区域高度 */
.system-info-section>>>.el-select__tags {
  max-height: 60px;
  overflow: hidden;
  display: block;
}

/* 确保输入区域不会过高 */
.system-info-section>>>.el-input__inner {
  height: auto;
  min-height: 40px;
  max-height: 60px;
  overflow: hidden;
}

/* 已选系统信息预览样式 */
.selected-info-preview {
  margin-top: 10px;
  padding: 10px;
  background-color: #ffffff;
  border-radius: 8px;
  max-height: 150px;
  overflow-y: auto;
  flex-grow: 1;
}

/* 已选信息标题 - 使用不透明背景 */
.selected-info-preview h4 {
  font-size: 14px;
  margin-top: 0;
  margin-bottom: 8px;
  color: #606266;
  position: sticky;
  top: 0;
  background-color: #ffffff; /* 完全不透明的背景 */
  padding: 2px 0;
  z-index: 1;
  border-bottom: 1px solid #f0f0f0;
}

.selected-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}

/* 右侧通知列表样式 */
.notification-list {
  flex: 2;
  padding: 0px;
  border-radius: 12px;
  background-color: rgb(245, 245, 250);
  overflow-y: auto;
  max-height: 100%;
}

.list-header {
  margin-bottom: 16px;
}

.list-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-bottom: 16px;
  justify-content: space-between;
}

.search-input {
  width: 180px;
}

/* 接收者样式 */
.card-recipients {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
}

.all-recipients {
  color: #409EFF;
  font-weight: 500;
  font-size: 13px;
}

.recipient-avatar {
  border: 2px solid white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.recipient-avatar + .recipient-avatar {
  margin-left: -8px;
}

.more-recipients {
  margin-left: 4px;
  background-color: #f2f6fc;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 12px;
  color: #606266;
}

/* 卡片操作样式 */
.card-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 通知预览样式 */
.notification-preview {
  padding: 10px;
  background-color: white;
  border-radius: 8px;
}

.preview-header {
  margin-bottom: 20px;
}

.preview-header h2 {
  margin-top: 0;
  margin-bottom: 12px;
  color: #303133;
}

.preview-meta {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.preview-time, .preview-expiry {
  color: #909399;
  font-size: 13px;
}

.preview-recipients {
  font-size: 14px;
  color: #606266;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.all-users {
  font-weight: 500;
  color: #409EFF;
}

.recipient-tag {
  margin-right: 0;
}

.preview-content {
  padding: 16px;
  background-color: #f9fafc;
  border-radius: 6px;
  line-height: 1.6;
  color: #303133;
  white-space: pre-line;
  margin-bottom: 20px;
}

.empty-content {
  color: #c0c4cc;
  font-style: italic;
}

/* 附件上传区域样式优化 */
.attachment-uploader>>>.el-upload-list__item {
  transition: none !important; /* 禁用可能冲突的过渡效果 */
  opacity: 1 !important;
  transform: none !important;
}

/* 为上传列表添加我们自己的渐入效果 */
.attachment-uploader>>>.el-upload-list__item-appear {
  animation: fadeIn 0.5s forwards;
}

/* 响应式调整 */
@media (max-width: 1400px) {
  .addons-container {
    flex-direction: column;
  }
  
  /* 在垂直布局模式下调整各区域高度 */
  .attachment-section, 
  .system-info-section {
    height: 50%;
  }
  
  .system-info-section>>>.el-tabs__content {
    max-height: 60px;
  }
  
  .selected-info-preview {
    height: calc(100% - 110px);
    max-height: 100px;
  }
  
  .attachment-uploader>>>.el-upload-list {
    max-height: calc(100% - 60px);
  }
  
  .system-info-section>>>.el-select__tags {
    max-height: 60px;
  }
  
  .system-info-section>>>.el-input__inner {
    max-height: 60px;
  }
}

@media (max-width: 1200px) {
  .content-area {
    flex-direction: column;
  }
  
  .notification-list {
    max-height: 500px;
  }
  
  .top-bar-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .user-select {
    width: 100%;
  }
  
  .recipient-selector {
    width: 100%;
  }
  
  .action-buttons {
    width: 100%;
    justify-content: flex-end;
  }
}

@media (max-width: 768px) {
  .action-buttons {
    flex-wrap: wrap;
    justify-content: flex-start;
  }
  
  .action-buttons .el-button {
    margin-bottom: 8px;
  }
}
</style>
