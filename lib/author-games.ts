export function validateGames(input:unknown):{name:string;url:string}[]|null{
 if(!Array.isArray(input)||input.length>50)return null;
 const games:{name:string;url:string}[]=[];const seen=new Set<string>();
 for(const game of input){
  if(!game||typeof game.name!=='string'||typeof game.url!=='string')return null;
  const name=game.name.trim(),url=game.url.trim();if(!name||name.length>120||url.length>500)return null;
  if(url){try{const u=new URL(url);if(u.protocol!=='https:'||!['youtube.com','www.youtube.com','youtu.be'].includes(u.hostname)||u.username||u.password)return null;}catch{return null;}}
  if(seen.has(name.toLowerCase()))return null;seen.add(name.toLowerCase());games.push({name,url});
 }return games;
}
