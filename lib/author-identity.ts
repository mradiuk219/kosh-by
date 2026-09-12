import {channelIdentity} from './channel-identity';
export const authorSlug=(url?:string)=>{const key=channelIdentity(url);return key?.startsWith('youtube:')?encodeURIComponent(key.slice(8).replaceAll('/','~')):null;};
export const authorPath=(url?:string)=>{const slug=authorSlug(url);return slug?'/authors/'+slug:null;};
