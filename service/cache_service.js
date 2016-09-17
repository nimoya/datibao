/**
 * 负责缓存的service
 * Created by 26053 on 2016/6/16.
 */
angular.module('DTB').service('CacheService',[
    '$q',
    'md5',
    function(
        $q,
        md5
    ){
        const fs   = require("fs");
        const path = require("path");

        const CACHE_DIR = "cache";

        const DATA_KEY = "DTB_DATA";

        const MAX_LOGIN_ACCOUNT_NUMBER = 10;

        /**
         * @desc 缓存某个用户的数据
         * @param user
         * @param data
         * @returns {$q|*}
         */
        this.storeUserData = function (user, userData) {
            return new $q((resolve, reject)=>{
                try {
                    let json = localStorage.getItem(DATA_KEY);

                    let data = {};
                    if (json != null) {
                        data = JSON.parse(json);
                    }

                    if (!data.users) {
                        data.users = {};
                    }
                    let users = data.users;

                    let key  = md5.createHash(user.name);
                    users[key] = userData;

                    localStorage.setItem(DATA_KEY, JSON.stringify(data));
                    resolve();
                } catch (err) {
                    reject(err);
                }

            });
            // return new $q((resolve, reject)=>{
            //     // 判断文件夹是否存在
            //     fs.access(CACHE_DIR, (err)=>{
            //         let promise = null;
            //         if (err) {
            //             promise = new $q((resolve, reject)=>{
            //                 fs.mkdir(CACHE_DIR, (err)=>{
            //                     if (err) {
            //                         reject(err);
            //                         return;
            //                     }
            //                     resolve();
            //                 })
            //             });
            //         } else {
            //             promise = $q.resolve();
            //         }
            //
            //         promise.then(()=>{
            //             try {
            //                 let filePath = path.join(CACHE_DIR, md5.createHash(user.name));
            //                 let json = JSON.stringify(data);
            //                 fs.writeFile(filePath, json, (err)=>{
            //                     if (err) {
            //                         reject(err);
            //                         return;
            //                     }
            //                     resolve();
            //                 });
            //             } catch (err) {
            //                 reject(err);
            //             }
            //         });
            //     });
            // })
        };

        /**
         * @desc 获取某个用户缓存的数据
         * @param user
         * @returns {$q|*}
         */
        this.restoreUserData = function (user) {
            return new $q((resolve, reject)=>{
                try {
                    let json = localStorage.getItem(DATA_KEY);
                    
                    let data = {};
                    if (json != null) {
                        data = JSON.parse(json);
                    }

                    let users = data.users || {};

                    let key  = md5.createHash(user.name);

                    resolve(users[key] || null);
                } catch (err) {
                    reject(err);
                }
            });
            // return new $q((resolve, reject)=>{
            //     try {
            //         let filePath = path.join(CACHE_DIR, md5.createHash(user.name));
            //
            //         // 判断文件是否存在
            //         fs.access(filePath, (err)=>{
            //             if (err) {
            //                 resolve({});
            //                 return;
            //             }
            //
            //             fs.readFile(filePath, (err, json)=>{
            //                 if (err) {
            //                     reject(err);
            //                     return;
            //                 }
            //
            //                 try {
            //                     let data = JSON.parse(json);
            //                     resolve(data);
            //                 } catch (err) {
            //                     reject(err);
            //                 }
            //             });
            //
            //         });
            //     } catch (err) {
            //         reject(err);
            //     }
            // });
        };

        /**
         * @desc 删除某个某个用户缓存的数据
         * @param user
         */
        this.removeUserData = function (user) {
            return new $q((resolve, reject)=>{
                try {
                    let json = localStorage.getItem(DATA_KEY);

                    let data = {};
                    if (json != null) {
                        data = JSON.parse(json);
                    }

                    if (!data.users) {
                        data.users = {};
                    }

                    let users = data.users;

                    let key  = md5.createHash(user.name);
                    delete users[key];

                    localStorage.setItem(DATA_KEY, JSON.stringify(data));
                    resolve();
                } catch (err) {
                    reject(err);
                }
            });
        };

        /**
         * @desc 存储用户的登陆信息
         * @param account
         * @returns {$q|*}
         */
        this.storeLoginAccount = function (account) {
            return new $q((resolve, reject)=>{
                try {
                    let json = localStorage.getItem(DATA_KEY);

                    let data = {};
                    if (json != null) {
                        data = JSON.parse(json);
                    }

                    if (!data.loginAccounts) {
                        data.loginAccounts = [];
                    }
                    let accounts = data.loginAccounts;

                    for (let i = 0, len = accounts.length; i < len; ++i) {
                        if (accounts[i].account === account.account) {
                            accounts.splice(i, 1);
                            break;
                        }
                    }
                    accounts.unshift(account);

                    if (accounts.length > MAX_LOGIN_ACCOUNT_NUMBER) {
                        accounts.pop();
                    }

                    localStorage.setItem(DATA_KEY, JSON.stringify(data));
                    resolve();
                } catch (err) {
                    reject(err);
                }
            });
        };

        /**
         * @desc 删除用户的登陆信息
         * @param account
         * @returns {$q|*}
         */
        this.removeLoginAccount = function (account) {
            return new $q((resolve, reject)=>{
                try {
                    let json = localStorage.getItem(DATA_KEY);

                    let data = {};
                    if (json != null) {
                        data = JSON.parse(json);
                    }

                    if (!data.loginAccounts) {
                        data.loginAccounts = [];
                    }
                    let accounts = data.loginAccounts;

                    for (let i = 0, len = accounts.length; i < len; ++i) {
                        if (accounts[i].account === account.account) {
                            accounts.splice(i, 1);
                            break;
                        }
                    }

                    localStorage.setItem(DATA_KEY, JSON.stringify(data));
                    resolve();
                } catch (err) {
                    reject(err);
                }
            });
        };

        /**
         * @desc 获取当前所有记录了的用户登陆信息
         * @returns {$q|*}
         */
        this.restoreAllLoginAccounts = function () {
            return new $q((resolve, reject)=>{
                try {
                    let json = localStorage.getItem(DATA_KEY);

                    let data = {};
                    if (json != null) {
                        data = JSON.parse(json);
                    }

                    resolve(data.loginAccounts || []);
                } catch (err) {
                    reject(err);
                }
            });
        };

        /**
         * @desc 缓存指定文件
         * @param fileName
         * @param file
         * @returns {$q|*}
         */
        this.cacheFile = function (fileName, file) {
            return new $q((resolve, reject)=>{
                try {
                    let execPath = process.execPath;
                    let execDir = path.dirname(execPath);

                    let fileDir = path.join(execDir, CACHE_DIR);

                    new $q((resolve, reject)=>{
                        fs.access(fileDir, function (err) {
                            let promise = null;
                            if (err) {
                                fs.mkdir(fileDir, function (err) {
                                    if (err) {
                                        reject(err);
                                        return;
                                    }
                                    resolve();
                                });

                            } else {
                                resolve();
                            }
                        });
                    }).then(()=>{
                        let filePath = path.join(fileDir, md5.createHash(fileName));
                        fs.writeFile(filePath, file, function (err) {
                            if (err) {
                                reject(err);
                                return;
                            }
                            resolve();
                        });

                    }).catch(reject);
                } catch (err) {
                    reject(err);
                }
            });
        };

        /**
         * @desc 获取指定缓存的文件
         * @param fileName
         * @returns {$q|*}
         */
        this.restoreFile = function (fileName) {
            return new $q((resolve, reject)=>{
                let execPath = process.execPath;
                let execDir = path.dirname(execPath);

                let filePath = path.join(execDir, CACHE_DIR, md5.createHash(fileName));

                fs.readFile(filePath, function (err, data) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(data);
                });
            });
        };

        /**
         * @desc 判断指定的文件是否缓存
         * @param fileName
         * @returns {$q|*}
         */
        this.isFileStore = function (fileName) {
            return new $q((resolve, reject)=>{
                let execPath = process.execPath;
                let execDir = path.dirname(execPath);

                let filePath = path.join(execDir, CACHE_DIR, md5.createHash(fileName));

                fs.access(filePath, function (err) {
                    if (err) {
                        resolve(false);
                    } else {
                        resolve(true);
                    }
                });
            });
        };
    }]
);