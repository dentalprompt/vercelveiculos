import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
if(!process.env.DATABASE_URL || !['localhost','127.0.0.1'].includes(new URL(process.env.DATABASE_URL).hostname)) throw Error('Use a disposable local DATABASE_URL');
const {pool}=await import('../src/auth/db.js'); pool.options.ssl=false;
const {ensureAdminSchema,createTracking}=await import('../src/admin/repository.js');
const {createUser}=await import('../src/auth/repository.js');
const {saveStaff}=await import('../src/admin/staff.js');
const {hashPassword,signAccessToken}=await import('../src/auth/security.js');
const {default:adminHandler}=await import('../api/admin.js');
const {default:customerHandler}=await import('../api/customer.js');
const prefix='motion-test-'+randomUUID(); const ids=[];
const response=()=>({statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v},end(s){this.body=JSON.parse(s)}});
async function adminCall(actor,body){const req={method:'PUT',body,headers:{authorization:'Bearer '+signAccessToken(actor)},query:{action:'trackings'},url:'/api/admin?action=trackings',socket:{remoteAddress:'127.0.0.1'}};const res=response();await adminHandler(req,res);return {status:res.statusCode,...res.body};}
async function browserCall(user){const req={method:'GET',headers:{authorization:'Bearer '+signAccessToken(user)},query:{action:'tracking-dashboard',motion:'1'},url:'/api/customer?action=tracking-dashboard&motion=1'};const res=response();await customerHandler(req,res);return {status:res.statusCode,...res.body};}
try{
 await ensureAdminSchema();
 const employee=await saveStaff({fullName:'Motion Employee',email:prefix+'@example.test',password:'testpass123'}); ids.push(employee.id);
 const customer=await createUser({fullName:'Motion Client',email:prefix+'-client@example.test',whatsapp:'11999999999',cpf:'motion-'+randomUUID(),cep:'06400000',address:'Rua Teste',number:'1',district:'Centro',city:'Barueri',state:'SP',passwordHash:await hashPassword('client123'),role:'customer',ownerId:employee.id}); ids.push(customer.id);
 const base={ownerId:employee.id,clientUserId:customer.id,clientName:customer.full_name,clientEmail:customer.email,itemName:'Veículo demonstrativo',status:'Em andamento',currentLocation:'Barueri - SP'};
 const first=await createTracking({...base,trackingCode:prefix+'-1'}),second=await createTracking({...base,trackingCode:prefix+'-2'});
 await pool.query('update public.app_client_tracking set animation_progress=.2,animation_running_since=now(),animation_paused=false where id=any($1::uuid[])',[[first.id,second.id]]);
 let result=await adminCall(employee,{id:first.id,status:'Em andamento',animationPaused:true}); assert.equal(result.status,200,JSON.stringify(result)); assert.equal(result.tracking.animation_paused,true);
 const [browserA,browserB]=await Promise.all([browserCall(customer),browserCall(customer)]); for(const browser of [browserA,browserB]){assert.equal(browser.status,200);assert.equal(browser.trackings.find(x=>x.id===first.id).animation_paused,true);assert.equal(browser.trackings.find(x=>x.id===second.id).animation_paused,false);}
 const pausedProgress=Number(browserA.trackings.find(x=>x.id===first.id).animation_progress);
 result=await adminCall(employee,{id:first.id,status:'Aguardando nota fiscal'});assert.equal(result.status,200);assert.equal(result.tracking.animation_paused,true);assert(Math.abs(Number(result.tracking.animation_progress)-pausedProgress)<.001);
 result=await adminCall(employee,{id:first.id,status:'Em inspeção',animationPaused:false});assert.equal(result.status,200);assert.equal(result.tracking.animation_paused,false);assert(result.tracking.animation_running_since);
 const [resumedA,resumedB]=await Promise.all([browserCall(customer),browserCall(customer)]);for(const browser of [resumedA,resumedB]) assert.equal(browser.trackings.find(x=>x.id===first.id).animation_paused,false);
 assert.equal(resumedA.trackings.find(x=>x.id===second.id).animation_paused,false);
 console.log('PASS dois navegadores, pausa/retomada sem recarga, status livre, progresso preservado e rastreios independentes');
} finally {await pool.query('delete from public.app_client_tracking where owner_id=$1',[ids[0]]).catch(()=>{});await pool.query('delete from public.app_users where id=any($1::uuid[])',[ids]).catch(()=>{});await pool.end();}
