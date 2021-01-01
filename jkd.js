/*
聚看点，所有任务+阅读
欢迎填写邀请码：24224873
打开'我的'获取Cookie
https:\/\/www\.xiaodouzhuan\.cn\/jkd\/newMobileMenu\/infoMe\.action url script-request-body https://raw.githubusercontent.com/shylocks/Loon/main/jkd.js

hostname = www.xiaodouzhuan.cn
~~~~~~~~~~~~~~~~
*/
const API_HOST = 'https://www.xiaodouzhuan.cn'
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
const $ = new Env("聚看点")
let cookiesArr = [
  
], cookie = '', message;

if ($.isNode()) {
  let JKCookie = []
  if (process.env.JKD_COOKIE && process.env.JKD_COOKIE.indexOf('@') > -1) {
    JKCookie = process.env.JKD_COOKIE.split('@');
  }
  else if (process.env.JKD_COOKIE && process.env.JKD_COOKIE.indexOf('&') > -1) {
    JKCookie = process.env.JKD_COOKIE.split('&');
  }
  else if (process.env.JKD_COOKIE && process.env.JKD_COOKIE.indexOf('\n') > -1) {
    JKCookie = process.env.JKD_COOKIE.split('\n');
  } else if (process.env.JKD_COOKIE){
    JKCookie = process.env.JKD_COOKIE.split()
  }
    Object.keys(JKCookie).forEach((item) => {
    if (JKCookie[item]) {
      cookiesArr.push(JKCookie[item])
    }
  })
  if (process.env.JKD_DEBUG && process.env.JKD_DEBUG === 'false') console.log = () => {
  };
} else {
  let cookiesData = $.getdata('CookiesJKD') || "[]";
  cookiesData = jsonParse(cookiesData);
  cookiesArr = cookiesData.map(item => item.cookie);
  cookiesArr.reverse();
  cookiesArr.reverse();
  cookiesArr = cookiesArr.filter(item => item !== "" && item !== null && item !== undefined);
}

if (typeof $request !== 'undefined') {
  if ($request && $request.method != `OPTIONS`) {
    const  bodyVal = $request.body
    let cks = $.getdata('CookiesJKD') || "[]"
    cks = jsonParse(cks);
    const Cookieval = $request.headers['Cookie']
    if(Cookieval){
      cks.push(Cookieval)
      $.setdata(JSON.stringify(cks),"CookiesJKD")
    }
    $.log(`Cookie:${Cookieval}`)
    $.log(`bodyVal:${bodyVal}`)
    $.msg($.name,`获取Cookie${cks.length}成功`)
    $.done()
  }
} else {
  !(async () => {
    if (!cookiesArr[0]) {
      $.msg($.name, '【提示】请先获取聚看点账号一cookie');
      return;
    }
    for (let i = 0; i < cookiesArr.length; i++) {
      if (cookiesArr[i]) {
        cookie = cookiesArr[i];
        await getOpenId()
        $.index = i + 1;
        if (!$.openId) {
          console.log(`Cookies${$.index}已失效！`)
          break
        }
        await getUserInfo()
        console.log(`\n******开始【聚看点账号${$.index}】${$.userName || $.openId}*********\n`);
        await jkd()
      }
    }
  })()
    .catch((e) => $.logErr(e))
    .finally(() => $.done())
  }

async function jkd() {
  $.profit = 0
  if (!$.isSign) await sign() // 签到
  $.log(`去领取阶段奖励`)
  await getStageState() // 阶段奖励
  // await getTaskList() // 任务
  for (let i = 0; i < $.videoPacketNum; ++i) {
    $.log(`去看激励视频`)
    await adv(17)
  }
  await openTimeBox()  // 宝箱
  await getTaskBoxProfit()  // 摇钱树1
  await getTaskBoxProfit(2) // 摇钱树2
  $.artList = []
  // 看视频
  await getArticleList(53)
  for (let i = 0; i < $.artList.length; ++i) {
    const art = $.artList[i]
    if (art['art_id']) {
      let uuid = generateUUID().toUpperCase()
      let artId = art['art_id']
      $.log(`去看视频：${artId}`)
      await call2(uuid)
      if ($.videocount === 0) {
        $.log(`观看视屏次数已满，跳出`)
        break
      }
      // await call1(artId)
      await getVideo(artId, true)
      // await video(artId)
      // await call1(uuid)
      await $.wait(31 * 1000)
      await videoAccount(artId)
      await $.wait(5 * 1000)
    }
  }
  $.artList = []
  // 看文章
  await getArticleList()
  for (let i = 0; i < $.artList.length; ++i) {
    const art = $.artList[i]
    if (art['art_id']) {
      let uuid = generateUUID().toUpperCase()
      await call2(uuid)
      if ($.artcount === 0) {
        $.log(`观看文章次数已满，跳出`)
        break
      }
      let artId = art['art_id']
      await getArticle(artId)
      await call1(uuid, artId)
      await article(artId)
      await openArticle(artId)
      await $.wait(31 * 1000)
      await readAccount(artId)
      await $.wait(5 * 1000)
    }
  }
  $.log(`本次运行完成，共计获得 ${$.profit} 金币`)
}

function getStageState() {
  return new Promise(resolve => {
    $.post(taskGetUrl("jkd/weixin20/newactivity/readStageReward.action",), async (err, resp, data) => {
      try {
        if (err) {
          $.log(`${JSON.stringify(err)}`)
          $.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          for (let i = 1; i <= 3; ++i) {
            let str = `var readtime${i} = "(.*)";`
            switch (parseInt(data.match(str)[1])) {
              case 1:
                $.log(`第${i}阶段奖励可领取`)
                await getStageReward(i)
                break
              case 2:
                $.log(`第${i}阶段奖励已领取过`)
                break
              default:
                $.log(`第${i}阶段未完成`)
                break
            }
          }
          //$.isSign = data.match(/var readtime1 = "(.*)";/)[1]

        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

function getTaskList() {
  let body = {
    "appid": "xzwl",
    "channel": "iOS",
    "psign": "92dea068b6c271161be05ed358b59932",
    "appversioncode": $.version,
    "time": new Date().getTime(),
    "apptoken": "xzwltoken070704",
    "appversion": "5.6.5",
    "openid": $.openId,
    "os": "iOS",
    "listtype": "wealnews",
    "ua": UA,
    "pageNo": 0,
    "pageSize": 20
  }
  return new Promise(resolve => {
    $.post(taskGetUrl("jkd/mobile/base/welfaretask/indexList.action",
      `jsondata=${escape(JSON.stringify(body))}`), async (err, resp, data) => {
      try {
        if (err) {
          $.log(`${JSON.stringify(err)}`)
          $.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data['ret'] === 'ok') {
              const taskList = data.data.data.list
              for (let i = 0; i < taskList.length; ++i) {
                const task = taskList[i]
                if (task['tstatus'] === 1) {
                  $.log(`去做任务【${task['name']}】`)
                  await doTask(task['pid'], task['name'], "doTask")
                  await doTask(task['pid'], task['name'], "getMoney")
                  await $.wait(15 * 1000)
                }
              }
            } else {
              $.log(`获取任务列表失败，错误信息：${JSON.stringify(data)}`)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

function doTask(taskId, taskName, action) {
  let body = {
    "appid": "xzwl",
    //"exporturl": "https:\/\/kyshiman.com\/kkz\/channel?ref=436",
    //"pageurl": "https:\/\/new.huanzhuti.com\/news\/26382197?cid=qsbk02",
    "slidenum": 1,
    "channel": "iOS",
    "psign": "92dea068b6c271161be05ed358b59932",
    "appversioncode": `${$.version}`,
    "time": `${new Date().getTime()}`,
    "apptoken": "xzwltoken070704",
    "appversion": "5.6.5",
    "openid": $.openID,
    "os": "iOS",
    "operatepath": "adDetail",
    "taskId": taskId,
    "billingtype": 2,
    "pagetype": "adDetail",
    // "name": taskName,
    "taskExecuteId": 0
  }
  $.log(`jsondata=${escape(JSON.stringify(body))}`)
  return new Promise(resolve => {
    $.post(taskPostUrl(`jkd/mobile/base/welfaretask/${action}.action`,
      `jsondata=${escape(JSON.stringify(body))}`), async (err, resp, data) => {
      try {
        if (err) {
          $.log(`${JSON.stringify(err)}`)
          //$.log(resp)
          $.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data['ret'] === 'ok') {
              const taskList = data.data.data.list
              for (let i = 0; i < taskList.length; ++i) {
                const task = taskList[i]
                if (task['tstatus'] === 1) {
                  await doTask()
                }
              }
            } else {
              $.log(`获取任务列表失败，错误信息：${JSON.stringify(data)}`)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

function getOpenId() {
  return new Promise(resolve => {
    $.post(taskGetUrl("jkd/task/userSign.action", "channel=iO"), async (err, resp, data) => {
      try {
        if (err) {
          $.log(`${JSON.stringify(err)}`)
          $.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          $.openId = data.match(/var openid = "(\S*)"/)[1]
          $.version = data.match(/var myversions = parseInt\("(.*)"\)/)[1]
          if ($.openId) {
            $.log(`获取openId成功`)
          }
          $.isSign = data.match(/var issign = parseInt\("(.*)"\)/)[1]
          $.videoPacketNum = data.match(/var videoPacketNum = (\S*);/)[1]
          $.newsTaskNum = data.match(/var newsTaskNum = (\S*);/)[1]
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

function getUserInfo() {
  let body = {
    "openid": $.openId,
    "channel": "iOS",
    "os": "iOS",
    "appversioncode": $.version,
    "time": new Date().getTime().toString(),
    "psign": "92dea068b6c271161be05ed358b59932",
    "apptoken": "xzwltoken070704",
    "appid": "xzwl",
    "appversion": "5.6.5"
  }
  return new Promise(resolve => {
    $.post(taskPostUrl("jkd/newMobileMenu/infoMe.action",
      `jsondata=${escape(JSON.stringify(body))}`), async (err, resp, data) => {
      try {
        if (err) {
          $.log(`${JSON.stringify(err)}`)
          $.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data['ret'] === 'ok') {
              $.userName = data.userinfo.username
              $.sum = data.userinfo.infoMeSumCashItem.title + data.userinfo.infoMeSumCashItem.value
              $.current = data.userinfo.infoMeCurCashItem.title + data.userinfo.infoMeCurCashItem.value
              $.gold = data.userinfo.infoMeGoldItem.title + ": " + data.userinfo.infoMeGoldItem.value
              console.log(`${$.gold}，${$.current}，${$.sum}`)
            } else {
              $.log(`个人信息获取失败，错误信息：${JSON.stringify(data)}`)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

function sign() {
  let body = `openID=${$.openId}&accountType=0`
  return new Promise(resolve => {
    $.get(taskGetUrl("jkd/task/sign.action", body), async (err, resp, data) => {
      try {
        if (err) {
          $.log(`${JSON.stringify(err)}`)
          $.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data['ret'] === 'ok') {
              $.profit += data.datas.signAmt
              $.log(`签到成功，获得 ${data.datas.signAmt}金币，已签到${data.datas.signDays}，下次签到金币：${data.datas.nextSignAmt}`)
              $.log(`去做签到分享任务`)
              await signShare(data.datas.position)
            } else {
              $.log(`签到失败，错误信息：${JSON.stringify(data)}`)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

function getTaskBoxProfit(boxType = 1) {
  let body = `box_type=${boxType}`
  return new Promise(resolve => {
    $.post(taskPostUrl("jkd/task/getTaskBoxProfit.action", body), async (err, resp, data) => {
      try {
        if (err) {
          $.log(`${JSON.stringify(err)}`)
          $.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data['ret'] === 'ok') {
              $.log(`摇钱树开启成功，获得 ${data.profit} 金币`)
              $.profit += data.profit
              if (data.advertPopup && data.advertPopup.advert) {
                $.log(`去做额外翻倍任务`)
                await adv(data.advertPopup.position)
              }
            } else if (data['ret'] === 'fail') {
              $.log(`摇钱树开启失败，错误信息：${data.rtn_msg}`)
            } else {
              $.log(`未知错误：${JSON.stringify(data)}`)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

function signShare(position) {
  let body = {
    "openid": $.openId,
    "channel": "iOS",
    "os": "iOS",
    "appversioncode": `${$.version}`,
    "time": `${new Date().getTime()}`,
    "psign": "92dea068b6c271161be05ed358b59932",
    "position": position,
    "apptoken": "xzwltoken070704",
    "appid": "xzwl",
    "appversion": "5.6.5"
  }
  return new Promise(resolve => {
    $.post(taskPostUrl("jkd/account/signShareAccount.action",
      `jsondata=${escape(JSON.stringify(body))}`), async (err, resp, data) => {
      try {
        if (err) {
          $.log(`${JSON.stringify(err)}`)
          $.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data['ret'] === 'ok') {
              $.log(`签到分享成功，获得 ${data.profit} 金币`)
              $.profit += data.profit
              if (data.advertPopup && data.advertPopup.advert) {
                $.log(`去做额外【${data.advertPopup.buttonText}】任务`)
                await adv(data.advertPopup.position)
              }
            } else if (data['ret'] === 'fail') {
              $.log(`签到失败，错误信息：${data.rtn_msg}`)
            } else {
              $.log(`未知错误：${JSON.stringify(data)}`)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

function adv(position) {
  let body = {
    "openid": $.openId,
    "channel": "iOS",
    "os": "iOS",
    "appversioncode": `${$.version}`,
    "time": `${new Date().getTime()}`,
    "psign": "92dea068b6c271161be05ed358b59932",
    "position": position,
    "apptoken": "xzwltoken070704",
    "appid": "xzwl",
    "appversion": "5.6.5"
  }
  return new Promise(resolve => {
    $.post(taskPostUrl("jkd/newmobile/stimulateAdv.action",
      `jsondata=${escape(JSON.stringify(body))}`), async (err, resp, data) => {
      try {
        if (err) {
          $.log(`${JSON.stringify(err)}`)
          $.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data['ret'] === 'ok') {
              $.log(`点击视频成功，预计获得${data.rewardAmount ? data.rewardAmount : 0}金币，等待30秒`)
              await $.wait(31 * 1000)
              body['time'] = `${new Date().getTime()}`
              await rewardAdv(body)
            } else if (data['ret'] === 'fail') {
              $.log(`点击视频失败，错误信息：${data.rtn_msg}`)
            } else {
              $.log(`未知错误：${JSON.stringify(data)}`)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

function rewardAdv(body) {
  return new Promise(resolve => {
    $.post(taskPostUrl("jkd/account/stimulateAdvAccount.action",
      `jsondata=${escape(JSON.stringify(body))}`), async (err, resp, data) => {
      try {
        if (err) {
          $.log(`${JSON.stringify(err)}`)
          $.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data['ret'] === 'ok') {
              $.log(`观看视频成功，获得${data.profit}金币`)
              $.profit += data.profit
            } else if (data['ret'] === 'fail') {
              $.log(`观看视频失败，错误信息：${data.rtn_msg}`)
            } else {
              $.log(`未知错误：${JSON.stringify(data)}`)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

function getArticleList(categoryId = 3) {
  let body = {
    "appid": "xzwl",
    "connectionType": 100,
    "optaction": "down",
    "pagesize": 12,
    "channel": "iOS",
    "psign": "92dea068b6c271161be05ed358b59932",
    "appversioncode": "565",
    "time": "1609437200",
    "apptoken": "xzwltoken070704",
    "cateid": categoryId,
    "openid": $.openId,
    "os": "iOS",
    "appversion": "5.6.5",
    "operatorType": 2,
    "page": 12
  }
  return new Promise(resolve => {
    $.post(taskPostUrl("jkd/newmobile/artlist.action",
      `jsondata=${escape(JSON.stringify(body))}`),
      async (err, resp, data) => {
        try {
          if (err) {
            $.log(`${JSON.stringify(err)}`)
            $.log(`${$.name} API请求失败，请检查网路重试`)
          } else {
            if (safeGet(data)) {
              data = JSON.parse(data);
              if (data['ret'] === 'ok') {
                $.artList = data.artlist
              }
            }
          }
        } catch (e) {
          $.logErr(e, resp)
        } finally {
          resolve(data);
        }
      })
  })
}

function openTimeBox() {
  let body = {
    "openid": $.openId,
    "channel": "iOS",
    "os": "iOS",
    "appversioncode": `${$.version}`,
    "time": `${new Date().getTime()}`,
    "psign": "92dea068b6c271161be05ed358b59932",
    "apptoken": "xzwltoken070704",
    "appid": "xzwl",
    "appversion": "5.6.5"
  }
  return new Promise(resolve => {
    $.post(taskPostUrl("jkd/account/openTimeBoxAccount.action",
      `jsondata=${escape(JSON.stringify(body))}`), async (err, resp, data) => {
      try {
        if (err) {
          $.log(`${JSON.stringify(err)}`)
          $.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data['ret'] === 'ok') {
              $.log(`宝箱奖励领取成功，获得 ${data.profit} 金币`)
              $.profit += data.profit
              if (data.advertPopup && data.advertPopup.position) {
                $.log(`去做额外【${data.advertPopup.buttonText}】任务`)
                await adv(data.advertPopup.position)
              }
            } else if (data['ret'] === 'fail') {
              $.log(`签到失败，错误信息：${data.rtn_msg}`)
            } else {
              $.log(`未知错误：${JSON.stringify(data)}`)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

function getArticle(artId) {
  let body = {
    "time": `${new Date().getTime()}`,
    "apptoken": "xzwltoken070704",
    "appversion": "5.6.5",
    "openid": $.openId,
    "channel": "iOS",
    "os": "iOS",
    "psign": "92dea068b6c271161be05ed358b59932",
    "artid": artId,
    "appid": "xzwl"
  }
  return new Promise(resolve => {
    $.post(taskPostUrl("jkd/newmobile/articleDetail.action",
      `jsondata=${escape(JSON.stringify(body))}`), async (err, resp, data) => {
      try {
        if (err) {
          $.log(`${JSON.stringify(err)}`)
          $.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data['ret'] === 'ok') {
              $.log(`articleDetail 记录成功`)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

function getVideo(artId) {
  let body = {
    "appid": "xzwl",
    "channel": "iOS",
    "psign": "92dea068b6c271161be05ed358b59932",
    "appversioncode": $.version.toString(),
    "time": new Date().getTime().toString(),
    "apptoken": "xzwltoken070704",
    "requestid": new Date().getTime().toString(),
    "openid": $.openId,
    "os": "iOS",
    "artid": artId,
    "appversion": "5.6.5",
    "relate": "1",
    "scenetype": ""
  }
  return new Promise(resolve => {
    $.post(taskPostUrl("jkd/newmobile/artDetail.action",
      `jsondata=${escape(JSON.stringify(body))}`), async (err, resp, data) => {
      try {
        if (err) {
          $.log(`${JSON.stringify(err)}`)
          $.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data['ret'] === 'ok') {
              $.log(`artDetail 记录成功`)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

function getStageReward(stage) {
  return new Promise(resolve => {
    $.post(taskPostUrl("jkd/weixin20/newactivity/getStageReward.action",
      `stage=${stage}`), async (err, resp, data) => {
      try {
        if (err) {
          $.log(`${JSON.stringify(err)}`)
          $.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data['ret'] === 'ok') {
              $.log(`阶段奖励${stage}获取成功，获得 ${data.profit} 金币`)
              $.profit += data.profit
            } else if (data['ret'] === 'fail') {
              $.log(`阶段奖励获取失败，错误信息：${data.rtn_msg}`)
            } else {
              $.log(`未知错误：${JSON.stringify(data)}`)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

function call2(uuid) {
  let body = {
    "openID": $.openId,
    "openid": $.openId,
    "app_id": "xzwl",
    "version_token": `${$.version}`,
    "channel": "iOS",
    "vercode": `${$.version}`,
    "psign": "92dea068b6c271161be05ed358b59932",
    "app_token": "xzwltoken070704",
    "version": "5.6.5",
    "pars": {
      "openID": $.openId,
      "uniqueid": uuid,
      "os": "iOS",
      "channel": "iOS",
      "openid": $.openId
    }
  }
  return new Promise(resolve => {
    $.post(taskPostUrl("jkd/minfo/call.action",
      `jdata=${escape(JSON.stringify(body))}&opttype=ART_READ`),
      async (err, resp, data) => {
        try {
          if (err) {
            $.log(`${JSON.stringify(err)}`)
            $.log(`${$.name} API请求失败，请检查网路重试`)
          } else {
            if (safeGet(data)) {
              data = JSON.parse(data);
              if (data['ret'] === 'ok') {
                $.artcount = data.datas.artcount
                $.videocount = data.datas.videocount
                $.log(`文章剩余观看次数：${$.artcount}，视频剩余观看次数：${$.videocount}`)
              }
            }
          }
        } catch (e) {
          $.logErr(e, resp)
        } finally {
          resolve(data);
        }
      })
  })
}

function call1(uuid, article_id) {
  let body = {
    "openID": $.openId,
    "openid": $.openId,
    "app_id": "xzwl",
    "version_token": `${$.version}`,
    "channel": "iOS",
    "vercode": `${$.version}`,
    "psign": "92dea068b6c271161be05ed358b59932",
    "app_token": "xzwltoken070704",
    "version": "5.6.5",
    "pars": {
      "openID": $.openId,
      "uniqueid": uuid,
      "os": "iOS",
      "channel": "iOS",
      "openid": $.openId,
      "article_id": article_id
    }
  }
  return new Promise(resolve => {
    $.post(taskPostUrl("jkd/minfo/call.action",
      `jdata=${escape(JSON.stringify(body))}&opttype=INF_ART_COMMENTS`),
      async (err, resp, data) => {
        try {
          if (err) {
            $.log(`${JSON.stringify(err)}`)
            $.log(`${$.name} API请求失败，请检查网路重试`)
          } else {
            if (safeGet(data)) {
              data = JSON.parse(data);
              // $.log(data)
            }
          }
        } catch (e) {
          $.logErr(e, resp)
        } finally {
          resolve(data);
        }
      })
  })
}

function article(artId) {
  let body = `articleid=${artId}&openID=${$.openId}&ce=iOS&request_id=${new Date().getTime()}&scene_type=art_recommend_iOS&articlevideo=0&version=5.6.5&account_type=1&channel=iOS&shade=1&a=zv8lS5d9LnyV7Bdoyt0NHQ==&font_size=1&scene_type=&request_id=${new Date().getTime()}`
  let config = {
    'url': 'https://www.jukandiannews.com/jkd/weixin20/station/stationarticle.action?' + body,
    'Host': 'www.jukandiannews.com',
    'origin': 'https://www.jukandiannews.com',
    'accept-language': 'zh-cn',
    'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
    'Cookie': cookie,
  }
  return new Promise(resolve => {
    $.get(config, async (err, resp, data) => {
      try {
        if (err) {
          $.log(`${JSON.stringify(err)}`)
          $.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          $.log(`article 记录成功`)
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

function openArticle(artId) {
  let body = `openID=${$.openId}&articleID=${artId}&ce=iOS&articlevideo=0&event=oa&advCodeRandom=0&isShowAdv=1`
  let config = {
    'url': 'https://www.jukandiannews.com/jkd/weixin20/station/articleOpen.action',
    body: body,
    'Host': 'www.jukandiannews.com',
    'accept': 'application/json, text/javascript, */*; q=0.01',
    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'origin': 'https://www.jukandiannews.com',
    'accept-language': 'zh-cn',
    'x-requested-with': 'XMLHttpRequest',
    'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
    'Cookie': cookie,
  }
  return new Promise(resolve => {
    $.post(config, async (err, resp, data) => {
      try {
        if (err) {
          $.log(`${JSON.stringify(err)}`)
          $.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          $.log(`openArticle 记录成功`)
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

function video(artId) {
  let body = `platfrom_id=qtt-video&articleid=${artId}&openID=${$.openId}`
  return new Promise(resolve => {
    $.get(taskGetUrl('jkd/weixin20/station/cnzzinVideo.action', body), async (err, resp, data) => {
      try {
        if (err) {
          $.log(`${JSON.stringify(err)}`)
          $.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          $.log(`video 记录成功`)
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

function readAccount(artId, payType = 1) {
  let body = {
    "appid": "xzwl",
    "read_weal": 0,
    "paytype": payType,
    "securitykey": "",
    "channel": "iOS",
    "psign": "92dea068b6c271161be05ed358b59932",
    "appversioncode": `${$.version}`,
    "time": `${new Date().getTime()}`,
    "apptoken": "xzwltoken070704",
    "appversion": "5.6.5",
    "openid": $.openId,
    "os": "iOS",
    "artid": artId,
    "accountType": "0",
    "readmodel": "1"
  }
  return new Promise(resolve => {
    $.post(taskPostUrl("jkd/account/readAccount.action",
      `jsondata=${escape(JSON.stringify(body))}`),
      async (err, resp, data) => {
        try {
          if (err) {
            $.log(`${JSON.stringify(err)}`)
            $.log(`${$.name} API请求失败，请检查网路重试`)
          } else {
            if (safeGet(data)) {
              data = JSON.parse(data);
              if (data['ret'] === 'ok') {
                $.log(`文章【${artId}】阅读成功，获得 ${data.profit} 金币`)
                $.profit += data.profit
              } else if (data['ret'] === 'fail') {
                $.log(`文章阅读失败，错误信息：${data.rtn_msg}`)
              } else {
                $.log(`未知错误：${JSON.stringify(data)}`)
              }
            }
          }
        } catch (e) {
          $.logErr(e, resp)
        } finally {
          resolve(data);
        }
      })
  })
}

function videoAccount(artId) {
  let body = {
    "appid": "xzwl",
    "read_weal": 0,
    "paytype": 2,
    "securitykey": "",
    "channel": "iOS",
    "psign": "92dea068b6c271161be05ed358b59932",
    "appversioncode": $.version,
    "time": new Date().toString(),
    "apptoken": "xzwltoken070704",
    "appversion": "5.6.5",
    "openid": $.openId,
    "os": "iOS",
    "artid": artId,
    "accountType": "0",
    "readmodel": "1"
  }
  return new Promise(resolve => {
    $.post(taskPostUrl("jkd/account/readAccount.action",
      `jsondata=${escape(JSON.stringify(body))}`),
      async (err, resp, data) => {
        try {
          if (err) {
            $.log(`${JSON.stringify(err)}`)
            $.log(`${$.name} API请求失败，请检查网路重试`)
          } else {
            if (safeGet(data)) {
              data = JSON.parse(data);
              if (data['ret'] === 'ok') {
                $.log(`视频【${artId}】阅读成功，获得 ${data.profit} 金币`)
                $.profit += data.profit
              } else if (data['ret'] === 'fail') {
                $.log(`视频阅读失败，错误信息：${data.rtn_msg}`)
              } else {
                $.log(`未知错误：${JSON.stringify(data)}`)
              }
            }
          }
        } catch (e) {
          $.logErr(e, resp)
        } finally {
          resolve(data);
        }
      })
  })
}

function safeGet(data) {
  try {
    if (typeof JSON.parse(data) == "object") {
      return true;
    }
  } catch (e) {
    $.log(e);
    $.log(`京东服务器访问数据为空，请检查自身设备网络情况`);
    return false;
  }
}

function jsonParse(str) {
  if (typeof str == "string") {
    try {
      return JSON.parse(str);
    } catch (e) {
      $.log(e);
      $.msg($.name, '', '不要在BoxJS手动复制粘贴修改cookie')
      return [];
    }
  }
}

function taskGetUrl(function_id, body) {
  return {
    url: `${API_HOST}/${function_id}?${body}`,
    headers: {
      "Cookie": cookie,
      'Content-Type': 'application/x-www-form-urlencoded',
      'accept': 'application/json, text/plain, */*',
      'origin': 'https://www.xiaodouzhuan.cn',
      'referer': 'https://www.xiaodouzhuan.cn',
      "User-Agent": UA
    }
  }
}

function taskPostUrl(function_id, body) {
  return {
    url: `${API_HOST}/${function_id}`,
    body: body,
    headers: {
      "Cookie": cookie,
      'Content-Type': 'application/x-www-form-urlencoded',
      'accept': 'application/json, text/plain, */*',
      'origin': 'https://www.xiaodouzhuan.cn',
      'referer': 'https://www.xiaodouzhuan.cn',
      "User-Agent": UA
    }
  }
}

function generateUUID() {
  var d = new Date().getTime();
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
  });
  return uuid;
}

function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`\ud83d\udd14${this.name}, \u5f00\u59cb!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),a={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(a,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t){let e={"M+":(new Date).getMonth()+1,"d+":(new Date).getDate(),"H+":(new Date).getHours(),"m+":(new Date).getMinutes(),"s+":(new Date).getSeconds(),"q+":Math.floor(((new Date).getMonth()+3)/3),S:(new Date).getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,((new Date).getFullYear()+"").substr(4-RegExp.$1.length)));for(let s in e)new RegExp("("+s+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?e[s]:("00"+e[s]).substr((""+e[s]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r)));let h=["","==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="];h.push(e),s&&h.push(s),i&&h.push(i),console.log(h.join("\n")),this.logs=this.logs.concat(h)}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t.stack):this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}

