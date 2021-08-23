const path = require("path");
const fs = require("fs-extra");
const inquirer = require("inquirer");
const Generator = require("./Generator");

/**
 * @description 执行创建命令
 * @property {String} name 创建文件的名字
 * @property {Object} options 命令中的参数 如 -f  结果 {force： true}
 */
module.exports = async (name, options) => {
  // 当前命令执行的位置
  const cwd = process.cwd();
  // 需要创建的目录地址
  const targetDir = path.join(cwd, name);

  // 目录是否已经存在？存在则是否是强制覆盖， 是直接覆盖，不是则询问是否覆盖
  if(fs.existsSync(targetDir)) {
    // 是否为强制覆盖？
    if(options.force) {
      await fs.remove(targetDir);
    } else {
      // 询问用户是否确定要覆盖
      const { action } = await inquirer.prompt([
        {
          name: "action",
          type: "list",
          message: "当前文件已经存在，是否覆盖",
          choices: [
            {
              name: "覆盖",
              value: "overwrite",
            },
            {
              name: "取消",
              value: false,
            },
          ],
        },
      ])

      // 返回的是choices 选择项的 value值
      if (!action) { // 选择了取消
        return;
      } else if(action === "overwrite") {  // 覆盖
        // 移除已存在的目录
        console.log(`\r\nRemoving...`);
        await fs.remove(targetDir);
      }
    }
  }

  // 创建项目
  const generator = new Generator(name, targetDir);
  // 开始创建项目
  generator.create()
}
