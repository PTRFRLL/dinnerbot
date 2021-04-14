const { format, parseISO } = require('date-fns');
/**
 * Example: Mar 26 10:56AM
 */
 const SIMPLE_DATE_FORMAT = 'MMM d h:mma';

 /**
  * Example: 2021-03-26 11:03:47
  */
 const LONG_DATE_FORMAT = 'yyyy-MM-dd HH:mm:ss';
 
 /**
  * Generates timestamp in given format
  * @param {*} dateFormat 
  * @param {*} inputDate 
  * @returns current time OR input date in given format
  */
 const getTimestamp = (dateFormat, inputDate) => {
     let date = new Date();
     if(inputDate){
         date = parseISO(inputDate)
     }
     return format(date, dateFormat);
 }

 module.exports = {
     getTimestamp,
     SIMPLE_DATE_FORMAT,
     LONG_DATE_FORMAT
 }