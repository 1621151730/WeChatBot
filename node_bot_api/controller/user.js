/*
 * @Author: wangwendie
 * @Date: 2023-07-04 13:44:45
 * @LastEditors: wangwendie
 * @Description:
 */

const dtime = require("time-formater")
const UserModel = require("../models/user.js");
const BaseComponent = require("../prototype/baseComponent.js");

class User extends BaseComponent {

  constructor() {
    super();
    this.registerUser = this.registerUser.bind(this);
    this.updataIntegral = this.updataIntegral.bind(this);
  }

  async registerUser (req, res, next) {
    const { user_name } = req.body;

    try {
      if (!user_name) {
        throw new Error('缺少参数：用户名不能为空');
      }
      const userinfo = await UserModel.findOne({ user_name }, "-_id -__v");
      if (userinfo) {
        throw new Error('注册失败，用户已经被注册');
      }
      const user_id = await this.getId('user_id');
      let newUser = {
        user_name: user_name,
        id: user_id,
        integral: 0,
        create_time: dtime().format('YYYY-MM-DD HH:mm:ss'),
        rank: -1
      }
      await UserModel.create(newUser);
      res.send({
        status: 200,
        message: '注册成功'
      });

      // 更新排名
      await this.updataUserRank(req, res, next);

    } catch (err) {
      console.log("什么错误:", err);
      res.send({
        status: 0,
        message: err.message
      })
      return;
    }
  }

  async userInfo (req, res, next) {
    const { user_name } = req.query;
    console.log("user_name", user_name);
    try {
      const userinfo = await UserModel.findOne({ user_name }, "-_id -__v");
      res.send({
        code: 200,
        result: userinfo
      })
    } catch (err) {
      console.log(err);
      res.send({
        status: 0,
        message: err.message
      })
      return
    }
  }

  async userRankingList (req, res, next) {
    try {
      const userList = await UserModel.find({}, "-_id -__v").sort({ integral: -1 });
      let userListString = "";
      userList.forEach((userItem, index) => {
        userListString += `${index + 1} 、${userItem.user_name} --- ${userItem.integral} \n`;
      })
      res.send({
        code: 200,
        message: '获取用户列表',
        result: userListString
      })
    } catch {
      console.log(err);
      res.send({
        status: 0,
        message: err.message
      })
      return
    }
  }

  async updataUserRank (req, res, next) {

    try {
      const userList = await UserModel.find({}).sort({ integral: -1 });
      let updateStatus = true;
      userList.forEach(async (userItem, index) => {
        if (userItem.rank != index + 1) {
          await UserModel.updateOne({ _id: userItem._id }, { $set: { rank: index + 1 } })
            .then(() => {
              console.log(`更新排序 ${userItem._id}成功`);
            })
            .catch(err => {
              console.error(`更新 ${userItem._id} 失败`, err);
              updateStatus = false;
            })
        }
      })
      return updateStatus;
    } catch (err) {
      console.error(err);
      res.send({
        status: 0,
        message: err.message
      })
      return
    }
  }

  async updataIntegral (req, res, next) {
    // 默认：type：0 为加
    const { type = 0, user_name } = req.query;
    let numSize = (type == 0 ? 1 : -1);
    try {
      const userInfo = await UserModel.updateOne({ user_name: user_name }, { $inc: { integral: numSize } });
      res.send({
        code: 200,
        message: "更新成功",
        result: userInfo
      });
      // 修改完，开始对排名进行排序
      if (userInfo.acknowledged) {
        // 更新排名
        await this.updataUserRank(req, res, next);
      }
    } catch (err) {
      res.send({
        status: 0,
        message: err.message
      })
      return
    }
  }

}

module.exports = new User();