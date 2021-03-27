import {format, parseISO } from 'date-fns';

/**
 * Example: Mar 26 10:56AM
 */
export const SIMPLE_DATE_FORMAT = 'MMM d h:mma';

/**
 * Example: 2021-03-26 11:03:47
 */
export const LONG_DATE_FORMAT = 'yyyy-MM-dd HH:mm:ss';

export const getTimestamp = (dateFormat: string, inputDate?: string) => {
    let date = new Date();
     if(inputDate){
         date = parseISO(inputDate)
     }
     return format(date, dateFormat);
}