import { openDB } from 'idb';
import type { Palette, Project } from './model';
const database=openDB('pinbean-local',1,{upgrade(db){db.createObjectStore('projects',{keyPath:'id'});db.createObjectStore('settings');}});
export async function saveProject(p:Project){await (await database).put('projects',p);await (await database).put('settings',p.id,'active');}
export async function listProjects():Promise<Project[]>{return (await (await database).getAll('projects')).sort((a,b)=>b.updated.localeCompare(a.updated));}
export async function loadActive():Promise<Project|undefined>{const db=await database;const id=await db.get('settings','active');return id?db.get('projects',id):undefined;}
export async function deleteProject(id:string){await(await database).delete('projects',id);}
export async function savePalettes(p:Palette[]){await(await database).put('settings',p,'palettes');}
export async function loadPalettes():Promise<Palette[]>{return (await(await database).get('settings','palettes'))||[];}
