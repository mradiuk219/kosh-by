import {getChatGPTUser} from '@/app/chatgpt-auth';
import {findAuthor,catalogDb} from '@/lib/public-catalog';
import {channelIdentity} from '@/lib/channel-identity';
import {validateGames} from '@/lib/author-games';
export async function PATCH(request:Request){
 const headers={'Cache-Control':'private, no-store'};
 const user=await getChatGPTUser();if(user?.email?.toLowerCase()!=='radziuk219@gmail.com')return Response.json({error:'Няма доступу'},{status:403,headers});
 if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Недапушчальны запыт'},{status:403,headers});
 const text=await request.text();if(text.length>32000)return Response.json({error:'Занадта шмат даных'},{status:413,headers});
 let body;try{body=JSON.parse(text);}catch{return Response.json({error:'Няправільныя даныя'},{status:400,headers});}
 const games=validateGames(body.games);if(!games||typeof body.slug!=='string')return Response.json({error:'Праверце назвы і спасылкі YouTube; максімум 50 гульняў, без паўтораў.'},{status:400,headers});
 const author=await findAuthor(body.slug);if(!author)return Response.json({error:'Аўтар не знойдзены'},{status:404,headers});
 await catalogDb().prepare('INSERT INTO author_details(canonical_key,games_json) VALUES (?,?) ON CONFLICT(canonical_key) DO UPDATE SET games_json=excluded.games_json').bind(channelIdentity(author.url),JSON.stringify(games)).run();
 return Response.json({ok:true},{headers});
}
