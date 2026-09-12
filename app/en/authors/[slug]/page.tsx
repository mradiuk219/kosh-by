import {AuthorPage} from '@/components/discovery-pages';
import {discoveryMetadata} from '@/lib/discovery-seo';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){return discoveryMetadata('en','authors',(await params).slug)}
export default async function Page({params}:{params:Promise<{slug:string}>}){return <AuthorPage locale="en" slug={(await params).slug}/>}
