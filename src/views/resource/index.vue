<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input
        placeholder="请输入文件名称"
        v-model="listQuery.appName"
        style="width: 200px;"
        class="filter-item"
      />
      <el-button
        class="filter-item"
        type="primary"
        icon="el-icon-search"
        @click="handleFilter"
        plain
      >搜索</el-button>
      <el-button class="filter-item" type="primary" icon="el-icon-add" @click="handleAdd" plain>上传文件</el-button>
    </div>

    <el-table :data="list" style="width: 100%" v-loading="listLoading">
      <el-table-column label="序号" prop="id">
        <template slot-scope="scope">
          <span>{{ scope.row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="应用名称" prop="appName">
        <template slot-scope="scope">
          <span>{{ scope.row.appName }}</span>
        </template>
      </el-table-column>
      <el-table-column label="推送ID" prop="pushCode">
        <template slot-scope="scope">
          <span>{{ scope.row.pushCode }}</span>
        </template>
      </el-table-column>
      <el-table-column label="平台" prop="brand">
        <template slot-scope="scope">
          <span>{{ showBrand(scope.row.brand) }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" label="操作" width="300">
        <template slot-scope="scope">
          <el-button size="mini" @click="handleDetail(scope.row)" type="info" plain>查看</el-button>
          <el-button size="mini" @click="handleEdit(scope.row)" type="success" plain>编辑</el-button>
          <el-button
            size="mini"
            type="danger"
            @click="handleDelete(scope.$index, scope.row)"
            plain
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination
      v-show="true"
      :total="total"
      :page.sync="listQuery.page"
      :limit.sync="listQuery.limit"
      @pagination="getList"
    />

    <el-dialog :title="dialogFormTitle" :visible.sync="dialogFormVisible">
      <el-form ref="form" :model="temp" label-width="120px" :rules="rules">
        <el-form-item label prop="title">
          <el-upload
            ref="upload"
            action="http://192.168.1.142:10600/file/upload/"
            :on-preview="handlePreview"
            :on-remove="handleRemove"
            :before-remove="beforeRemove"
            :on-success="handleSuccess"
            multiple
            :limit="3"
            :on-exceed="handleExceed"
            :file-list="fileList"
          >
            <el-button size="small" type="primary" plain>选择文件</el-button>
            <div slot="tip" class="el-upload__tip"></div>
          </el-upload>
        </el-form-item>

        <el-form-item label="标签" prop="sign">
          <el-tag
            :key="tag"
            v-for="tag in dynamicTags"
            closable
            :disable-transitions="false"
            @close="handleClose(tag)"
          >{{tag}}</el-tag>
          <el-input
            class="input-new-tag"
            v-if="inputVisible"
            v-model="inputValue"
            ref="saveTagInput"
            size="small"
            @keyup.enter.native="handleInputConfirm"
            @blur="handleInputConfirm"
          ></el-input>
          <el-button v-else class="button-new-tag" size="small" @click="showInput">+</el-button>
        </el-form-item>
        <el-form-item label="备注" prop="remarks">
          <el-input type="textarea" v-model="temp.remarks"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确认</el-button>
      </div>
    </el-dialog>

    <el-dialog title="提示" :visible.sync="centerDialogVisible" width="30%">
      <span>{{centerDialogValue}}</span>
      <span slot="footer" class="dialog-footer">
        <el-button @click="centerDialogVisible = false">取 消</el-button>
        <el-button type="danger" @click="deleteData(temp.id)">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {
  queryConfig,
  updateConfig,
  deleteConfig,
  addConfig,
  pushMessage
} from "@/api/config";
import Pagination from "@/components/Pagination";
export default {
  data() {
    return {
      dynamicTags: ["标签一", "标签二", "标签三"],
      inputVisible: false,
      inputValue: "",
      dialogFormVisible: false,
      centerDialogVisible: false,
      pushDialogVisible: false,
      dialogFormStatus: "detail",
      dialogFormTitle: "",
      list: [],
      fileList: [],
      total: 0,
      listQuery: {
        page: 1,
        limit: 10,
        appName: ""
      },
      listLoading: false,
      rules: {
        appName: [
          { required: true, message: "请输入应用名称", trigger: "blur" }
        ],
        packageName: [
          {
            required: true,
            message: "请输入包名",
            trigger: "blur"
          }
        ],
        title: [{ required: true, message: "请输入标题", trigger: "blur" }],
        content: [
          {
            required: true,
            message: "请输入内容",
            trigger: "blur"
          }
        ],
        clientId: [
          {
            required: true,
            message: "请输入设备ID",
            trigger: "blur"
          }
        ]
      },
      centerDialogValue: "",
      search: "",
      temp: {
        id: "",
        fileName: "",
        remarks: "",
        sign: "",
        filePath: ""
      },
      brandOptions: [
        { label: "华为", value: 1 },
        { label: "小米", value: 2 },
        { label: "OPPO", value: 3 },
        { label: "VIVO", value: 4 }
      ],
      userId: ""
    };
  },
  methods: {
    handleClose(tag) {
      this.dynamicTags.splice(this.dynamicTags.indexOf(tag), 1);
    },

    showInput() {
      this.inputVisible = true;
      this.$nextTick(_ => {
        this.$refs.saveTagInput.$refs.input.focus();
      });
    },

    handleInputConfirm() {
      let inputValue = this.inputValue;
      if (inputValue) {
        this.dynamicTags.push(inputValue);
      }
      this.inputVisible = false;
      this.inputValue = "";
    },
    handleSuccess(response, file, fileList) {
      console.log(file);
      if (response.code != 0) {
        this.$message.error(response.msg);
        this.$refs.upload.clearFiles();
      }
      this.temp.filePath = response.data;
      this.temp.fileName = file.name;
      console.log(this.temp);
    },
    handleRemove(file, fileList) {
      console.log(file, fileList);
    },
    handlePreview(file) {},
    handleExceed(files, fileList) {
      this.$message.warning(
        `当前限制选择 3 个文件，本次选择了 ${
          files.length
        } 个文件，共选择了 ${files.length + fileList.length} 个文件`
      );
    },
    beforeRemove(file, fileList) {
      return this.$confirm(`确定移除 ${file.name}？`);
    },
    handleDetail(row) {
      this.temp = Object.assign({}, row);
      (this.dialogFormTitle = "查看应用"), (this.dialogFormVisible = true);
      this.dialogFormStatus = "detail";
    },
    handleEdit(row) {
      this.temp = Object.assign({}, row);
      (this.dialogFormTitle = "编辑应用"), (this.dialogFormVisible = true);
      this.dialogFormStatus = "edit";
    },
    handleAdd() {
      this.resetTemp();
      (this.dialogFormTitle = "上传文件"), (this.dialogFormVisible = true);
      this.dialogFormStatus = "add";
    },
    handlePush(row) {
      this.temp = Object.assign({}, row);
      this.pushDialogVisible = true;
    },
    handleFilter() {
      this.getList();
    },
    resetTemp() {
      this.temp = {};
    },
    showBrand(brand) {
      switch (brand) {
        case 1:
          return "华为";
        case 2:
          return "小米";
        case 3:
          return "OPPO";
        case 4:
          return "VIVO";
        default:
          return "其他";
      }
    },
    pushMessage() {
      const tempData = {
        id: this.temp.id,
        appName: this.temp.appName,
        packageName: this.temp.packageName,
        appId: this.temp.appId,
        appKey: this.temp.appKey,
        appSecret: this.temp.appSecret,
        masterSecret: this.temp.masterSecret,
        brand: this.temp.brand,
        title: this.temp.title,
        content: this.temp.content,
        clientId: this.temp.clientId
      };
      this.$refs["form"].validate(valid => {
        if (valid) {
          pushMessage(tempData).then(() => {
            this.$notify({
              title: "应用管理",
              message: "消息推送成功",
              type: "success",
              duration: 2000
            });
            this.pushDialogVisible = false;
          });
        }
      });
    },
    handleConfirm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          const tempData = {
            id: this.temp.id,
            appName: this.temp.appName,
            packageName: this.temp.packageName,
            appId: this.temp.appId,
            appKey: this.temp.appKey,
            appSecret: this.temp.appSecret,
            masterSecret: this.temp.masterSecret,
            brand: this.temp.brand
          };
          switch (this.dialogFormStatus) {
            case "edit":
              updateConfig(tempData).then(() => {
                this.$notify({
                  title: "应用管理",
                  message: "修改应用成功",
                  type: "success",
                  duration: 2000
                });
                this.dialogFormVisible = false;
                this.getList();
              });
              break;
            case "add":
              addConfig(tempData).then(() => {
                this.$notify({
                  title: "应用管理",
                  message: "添加应用成功",
                  type: "success",
                  duration: 2000
                });
                this.dialogFormVisible = false;
                this.getList();
              });
              break;
            default:
          }
        }
      });
    },
    handleDelete(index, row) {
      this.temp.id = row.id;
      this.centerDialogVisible = true;
      this.centerDialogValue = "确定删除 " + row.appName + "?";
    },
    deleteData(id) {
      let param = {
        id: id
      };
      deleteConfig(param).then(() => {
        this.centerDialogVisible = false;
        this.$notify({
          title: "应用管理",
          message: "删除应用成功",
          type: "success",
          duration: 2000
        });
        this.getList();
      });
    },

    getList() {
      this.listLoading = true;
      queryConfig(this.listQuery).then(response => {
        this.list = response.data.items;
        this.total = response.data.total;
        this.listLoading = false;
      });
    },
    getParams() {
      this.userId = this.$route.query.userId;
      console.log("userId:" + this.userId);
    }
  },
  created() {
    this.getParams();
    this.getList();
  },
  components: {
    Pagination
  }
};
</script>

<style scoped>
.el-tag + .el-tag {
  margin-left: 10px;
}
.button-new-tag {
  margin-left: 10px;
  height: 32px;
  line-height: 30px;
  padding-top: 0;
  padding-bottom: 0;
}
.input-new-tag {
  width: 90px;
  margin-left: 10px;
  vertical-align: bottom;
}
</style>

