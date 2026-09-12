import {TopicPage} from '@/components/discovery-pages';
import {discoveryMetadata} from '@/lib/discovery-seo';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){return discoveryMetadata('en','topics',(await params).slug)}
export default async function Page({params,searchParams}:{params:Promise<{slug:string}>;searchParams:Promise<{page?:string}>}){return <TopicPage locale="en" slug={(await params).slug} page={(await searchParams).page}/>}
