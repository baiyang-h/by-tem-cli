const chalk = require("chalk");
const ora = require("ora"); // 控制台loading
const util = require("util");
const path = require("path");
const inquirer = require("inquirer"); // 命令行询问用户问题，记录回答结果
const api = require('./api');
const github = require('./github');
const downloadGitRepo = require("download-git-repo");

class Generator {
  constructor(name, targetDir) {
    // 目录名称
    this.name = name;
    // 创建位置
    this.targetDir = targetDir;
    // 对 download-git-repo 进行 promise 化改造
    this.downloadGitRepo = util.promisify(downloadGitRepo);
  }

  /**
   * 获取框架对应的模板
   * 1. 基于 repo 结果，远程拉取对应的模板列表   repo有 vue、react
   * 2. 用户选择自己需要下载的模板
   * 3. return 用户选择的模板名
   */
  async getRepo() {
    const { data } = await api.getRepoList()

    // 1. 是文件夹 type === 'tree' 表示是一个文件夹，不是文件
    // 2. 过滤我们需要的名称
    const temNames = data.tree.filter(item => item.type === 'tree').map(item => item.path);
    // // 用户选择自己需要下载的 template 名字
    const { name } = await inquirer.prompt({
      name: "name",
      type: "list",
      choices: temNames,
      message: "请选择您要下载的模板",
    });
    github.path = name
    // 选择的name
    return name
  }

  // 下载远程模板
  async download(name, success=()=>{}, fail=()=>{}) {
    // 使用 ora 初始化，传入提示信息 message
    const spinner = ora(`下载模板：github:${github.owner}/${github.repo}/${github.ref}/${name}`);
    // 开始加载动画
    spinner.start();
    try {
      const result = await this.downloadGitRepo(`direct:http://github.com/${github.owner}/${github.repo}/${name}`, path.resolve(process.cwd(), this.targetDir))
      // 状态为修改为成功
      spinner.succeed();
      success();
      return result
    } catch (e) {
      // 状态为修改为失败
      spinner.fail("请求失败 ...");
      fail();
    }
  }

  // 核心创建逻辑
  async create() {
    // 1) 获取模板名称
    const name = await this.getRepo();

    // 2）下载模板到模板目录
    await this.download(name, () => {
      // 3）模板使用提示
      console.log(`\r\nSuccessfully created project ${chalk.cyan(this.name)}`);
      console.log(`\r\n  cd ${chalk.cyan(this.name)}`);
    });

  }
}

module.exports = Generator
