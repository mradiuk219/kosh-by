import {TopicPage} from '@/components/discovery-pages';
import {discoveryMetadata} from '@/lib/discovery-seo';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){return discoveryMetadata('be','topics',(await params).slug);}
export default async function Page({params,searchParams}:{params:Promise<{slug:string}>;searchParams:Promise<{page?:string}>}){const {slug}=await params;return <TopicPage locale="be" slug={slug} page={(await searchParams).page}/>;}
