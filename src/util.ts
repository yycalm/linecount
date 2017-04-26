////////////////////////////////////
/*
低耦合函数
*/
////////////////////////////////////

export function inString(text: string, offset: number): boolean {
    let isin = false;
    var pos = text.indexOf('"');
    while (pos >= 0) {
        if (pos < offset) {
            if (pos == 0 || text.charAt(pos - 1) != '\\') {
                isin = !isin;
            }
        } else {
            break;
        }
        pos = text.indexOf('"', pos + 1);
    }
    return isin;
}

export function getDateTime(): string {
    var date = new Date();
    var seperator1 = "-";
    var seperator2 = ":";
    var month = date.getMonth() + 1;
    var day = date.getDate();
    let smonth = month.toString();
    if (month >= 1 && month <= 9) {
        smonth = "0" + month;
    }
    let sday = day.toString();
    if (day >= 0 && day <= 9) {
        sday = "0" + day;
    }
    let shour = date.getHours().toString();
    if (date.getHours() >= 0 && date.getHours() <= 9) {
        shour = "0" + shour;
    }
    let sminutes = date.getMinutes().toString();
    if (date.getMinutes() >= 0 && date.getMinutes() <= 9) {
        sminutes = "0" + sminutes;
    }
    let sseconds = date.getSeconds().toString();
    if (date.getSeconds() >= 0 && date.getSeconds() <= 9) {
        sseconds = "0" + sseconds;
    }
    let currentdate = date.getFullYear() + seperator1 + smonth + seperator1 + sday
        + " " + shour + seperator2 + sminutes + seperator2 + sseconds;
    return currentdate;
}