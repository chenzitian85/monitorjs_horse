import { ErrorLevelEnum,ErrorCategoryEnum } from "./baseConfig.js";
import DeviceInfo from "../device";
import API from "./api.js";
import utils from "./utils.js";

/**
 * 监控基类
 */
class BaseMonitor {

    /**
     * 上报错误地址
     * @param {*} params { reportUrl,extendsInfo }
     */
    constructor(params){
        this.category = ErrorCategoryEnum.UNKNOW_ERROR; //错误类型
        this.level = ErrorLevelEnum.INFO; //错误等级
        this.msg = "";  //错误信息
        this.url = "";  //错误信息地址
        this.line = ""; //行数
        this.col = "";  //列数
        this.errorObj = "";  //错误堆栈

        this.reportUrl = params.reportUrl; //上报错误地址
        this.extendsInfo = params.extendsInfo; //扩展信息
        this.errorAfter = params.errorAfter; //错误回调
    }

    /**
     * 记录错误信息
     */
    recordError(){
        setTimeout(()=>{
            try {
                if(!this.msg){
                    return;
                }
                //过滤掉错误上报地址
                if( this.reportUrl && this.url && this.url.toLowerCase().indexOf(this.reportUrl.toLowerCase())>=0 ){
                    console.log("统计错误接口异常",this.msg);
                    return;
                }
                let errorInfo = this.handleErrorInfo();

                console.log("````````````````````` "+this.category+" `````````````````````",errorInfo)

                //记录日志
                new API(this.reportUrl).report(errorInfo);

                utils.isFunction(this.errorAfter) && this.errorAfter(errorInfo);
            } catch (error) {
                console.log(error);
            }
        },100);
    }

    /**
     * 处理错误信息
     * @param {*} extendsInfo 
     */
    handleErrorInfo(){
        let txt = "Category: " + this.category + "\n";
        txt += "Error: " + this.msg + "\n";;
        txt += "URL: " + this.url + "\n";
        switch(this.category){
            case ErrorCategoryEnum.JS_ERROR:
                txt += "Line: " + this.line + "\n";
                txt += "Colno: " + this.col + "\n";
                if (this.errorObj && this.errorObj.stack) {
                    txt += "Stack: " + this.errorObj.stack + "\n";
                }
                break;
            default:
                txt += "OtherError: " + JSON.stringify(this.errorObj) + "\n";
                break;
        }
        let deviceInfo = this.getDeviceInfo();
        txt += "DeviceInfo: " + deviceInfo; //设备信息
        let extendsInfo = this.getExtendsInfo();
        let recordInfo = extendsInfo;
        recordInfo.SubCategory = this.category; //错误分类
        recordInfo.LogType = this.level;  //错误级别
        recordInfo.LogInfo = txt;  //错误信息
        recordInfo.DeviceInfo = deviceInfo; //设备信息
        return recordInfo;
    }

    /**
     * 获取扩展信息
     */
    getExtendsInfo(){
        try {
            let ret = {};
            let extendsInfo = this.extendsInfo || {};
            let dynamicParams;
            if(utils.isFunction(extendsInfo.getDynamic)){
                dynamicParams = extendsInfo.getDynamic();   //获取动态参数
            }
            //判断动态方法返回的参数是否是对象
            if(utils.isObject(dynamicParams)){
                extendsInfo = {...extendsInfo,...dynamicParams};
            }
            //遍历扩展信息，排除动态方法
            for(var key in extendsInfo){
                if(!utils.isFunction(extendsInfo[key])){    //排除获取动态方法
                    ret[key] = extendsInfo[key];
                }
            }
            return ret;
        } catch (error) {
            console.log('call getExtendsInfo error',error);
            return {};  
        }
    }
    
    /**
     * 获取设备信息
     */
    getDeviceInfo(){
        try {
            let deviceInfo = DeviceInfo.getDeviceInfo();
            return JSON.stringify(deviceInfo);
        } catch (error) {
            console.log(error);
            return "";
        }
    }

}
export default BaseMonitor;
