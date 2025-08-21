import { format } from "date-fns";

export const formatTimestamp = (timestamp: number, formatString: string = 'dd MMM, HH:mm:ss') => {
    if (!timestamp) return '-';
    return format(new Date(timestamp), formatString);
};