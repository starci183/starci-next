import React, { useState } from 'react'
import { marked } from 'marked'
import {
  CoreGrammarRoot, Page, PrimaryRailLayout, Region, SectionHeader, Text, Code, Link,
  MarkdownArticle, MarkdownTableFrame, FencedCodeBlock, MermaidDiagram, Accordion,
  SurfaceCard, Disclosure, Stepper, Form, Input, Textarea, NumberField, Select,
  RadioGroup, CheckboxGroup, SegmentedControl, Button, Alert, EmptyNotice, Progress,
  Skeleton, List, ListRow,
} from '@starci/grammar/core'
import { SiteShell } from '../../../../../fe/packages/starci-next-ui/src/composites/SiteShell/index'
import reference from '../../../../_resources/fixtures/lessons/academy-rest-semantics-v1/draw-reference/reference.json'
import { classes } from './direction.classes'

// A reviewable drawing, with no API, persistence, provider calls, or protected grading. It is prerendered to static
// markup: every state is drawn once below the page, so the delivered HTML carries no script.
// Source public fields are consumed verbatim; the article renderer changes only Markdown anatomy.
const steps = [
  ['read-original', 'Read the original article', 'Read the selected original article, then state its main contract and cite the section you used.'],
  ['explain-concept', 'Explain the core concept', 'Explain verb-to-operation mapping, status codes, PUT versus PATCH, and idempotency using the article.'],
  ['trace-code', 'Trace the working code', 'Choose one of the original four flow tests; trace its request through the selected language and explain the observed result.'],
  ['interview', 'Practice interview questions', 'Answer each of the three original interview questions for the selected programming language.'],
  ['challenge', 'Solve a challenge', 'Choose one of the four original challenges and submit the artifact its source submission type requests.'],
] as const
const states = ['policyPending','empty','loading','draft','saving','saved','streaming','feedbackReady','errorBeforeSave','errorAfterSave','interrupted','resume','conflict','lockedStep','locked','notFound','variantOrVersionUnavailable','complete']
const names: Record<string,string> = {
  policyPending:'Chính sách đang chờ duyệt', empty:'Chưa có tiến độ', loading:'Đang tải', draft:'Trước khi trả lời', saving:'Đang lưu', saved:'Đã lưu', streaming:'Đang tạo phản hồi', feedbackReady:'Phản hồi hoàn tất', errorBeforeSave:'Lỗi trước khi lưu', errorAfterSave:'Lỗi sau khi lưu', interrupted:'Luồng bị gián đoạn', resume:'Tiếp tục phiên học', conflict:'Xung đột phiên bản', lockedStep:'Bước chưa mở', locked:'Không có quyền truy cập', notFound:'Không tìm thấy bài', variantOrVersionUnavailable:'Biến thể / phiên bản không có', complete:'Hoàn tất năm bước',
}
const sectionOptions = reference.outline.map(s=>({id:s.id,label:s.text}))
const languageOptions = [{value:'typescript',label:'TS'},{value:'java',label:'Java'},{value:'csharp',label:'C#'},{value:'go',label:'Go'}]
const languageNames: Record<string,string> = {typescript:'TypeScript',java:'Java',csharp:'C#',go:'Go'}
const authoredMermaid = reference.publicArticle.match(/```mermaid\r?\n([\s\S]*?)```/)![1]
const authoredFlows = [...reference.publicArticle.matchAll(/:::panel\{title="([^"]*)"\}/g)].map((p,i)=>({value:`flow-${i+1}`,label:inline(marked.Lexer.lexInline(p[1]))}))

function inline(tokens: any[] = []): React.ReactNode {
  return tokens.map((t,i)=>{
    const content = t.tokens ? inline(t.tokens) : t.text
    switch(t.type){
      case 'strong': return <strong key={i}>{content}</strong>
      case 'em': return <em key={i}>{content}</em>
      case 'codespan': return <Code key={i}>{t.text}</Code>
      case 'link': return <Link key={i} href={t.href} kind={t.href.startsWith('http')?'external':'internal'} externalHint="Mở trong thẻ mới">{content}</Link>
      case 'br': return <br key={i}/>
      default: return <React.Fragment key={i}>{content}</React.Fragment>
    }
  })
}
function markdownTokens(tokens: any[], loading=false, prefix=''): React.ReactNode {
  return tokens.map((t,i)=>{
    switch(t.type){
      case 'space': return null
      case 'heading': {
        const number=t.text.match(/^(\d+(?:\.\d+)*)\./)?.[1]
        return <Region key={i} id={number?`${prefix}section-${number}`:undefined} label={t.text}><SectionHeader title={inline(t.tokens)} level={t.depth} isSkeleton={loading}/></Region>
      }
      case 'paragraph': return loading ? <Skeleton key={i} lines={3}/> : <p key={i}>{inline(t.tokens)}</p>
      case 'text': return <React.Fragment key={i}>{t.tokens?inline(t.tokens):t.text}</React.Fragment>
      case 'code': return t.lang==='mermaid'
        ? <MermaidDiagram key={i} source={authoredMermaid} label="Kiến trúc resource users: Client, NestJS app và PostgreSQL" height="md" errorTitle="Không thể vẽ sơ đồ gốc" isSkeleton={loading}/>
        : <FencedCodeBlock key={i} language={t.lang} code={t.text} label={`${t.lang || 'Code'} — mã gốc`} isSkeleton={loading}/>
      case 'list': {const Tag=t.ordered?'ol':'ul'; return <Tag key={i}>{t.items.map((item:any,j:number)=><li key={j}>{markdownTokens(item.tokens,loading,prefix)}</li>)}</Tag>}
      case 'blockquote': return <blockquote key={i}>{markdownTokens(t.tokens,loading,prefix)}</blockquote>
      case 'table': return <MarkdownTableFrame key={i} label="Thành phần và vai trò"><table><thead><tr>{t.header.map((c:any,j:number)=><th key={j}>{inline(c.tokens)}</th>)}</tr></thead><tbody>{t.rows.map((r:any,j:number)=><tr key={j}>{r.map((c:any,k:number)=><td key={k}>{inline(c.tokens)}</td>)}</tr>)}</tbody></table></MarkdownTableFrame>
      default: return null
    }
  })
}
function Source({source,loading=false,prefix=''}:{source:string,loading?:boolean,prefix?:string}){
  // The fixture's authored accordion and muted directives are parsed, never rewritten.
  const chunks=source.split(/(::::accordion\r?\n[\s\S]*?\r?\n::::)/g)
  return <MarkdownArticle>{chunks.map((chunk,i)=>{
    if(chunk.startsWith('::::accordion')){
      const panels=[...chunk.matchAll(/:::panel\{title="([^"]*)"\}\r?\n([\s\S]*?)\r?\n:::(?=\r?\n|$)/g)]
      return <Accordion key={i} label="Bốn luồng kiểm thử gốc" headingLevel={5} allowsMultipleExpanded defaultExpandedIds={['flow-1']} items={panels.map((p,j)=>({id:`flow-${j+1}`,title:inline(marked.Lexer.lexInline(p[1])),content:<Source source={p[2]} loading={loading} prefix={prefix}/>}))}/>
    }
    const plain=chunk.replace(/:::muted\r?\n([^]*?)\r?\n:::/g,(_,text)=>text)
    return <React.Fragment key={i}>{markdownTokens(marked.lexer(plain),loading,prefix)}</React.Fragment>
  })}</MarkdownArticle>
}
type Part='page'|'body'|'rail'|'form'
function App({state,initialStep=0,part='page',prefix=''}:{state?:string,initialStep?:number,part?:Part,prefix?:string}){
  // A preview prefixes its own ids; a rail preview links to the page's article above it.
  const ap=part==='body'?prefix:''
  const [view,setView]=useState(state||'policyPending')
  const [step,setStep]=useState(initialStep)
  const [language,setLanguage]=useState('typescript')
  const [question,setQuestion]=useState('')
  const [scope,setScope]=useState('section-2.1.2')
  const [drafts,setDrafts]=useState<Record<string,string>>({})
  const [sections,setSections]=useState<string[]>(['section-1'])
  const [flow,setFlow]=useState('flow-1')
  const [challenge,setChallenge]=useState(reference.challengeDefinitions[0].id)
  const [interview,setInterview]=useState('interview-1')
  const [interviewStates,setInterviewStates]=useState<Record<string,string>>({'interview-1':state||'draft'})
  const [verbs,setVerbs]=useState(['POST'])
  const [askState,setAskState]=useState('idle')
  const [outlineOpen,setOutlineOpen]=useState(false)
  const [error,setError]=useState('')
  const [completed,setCompleted]=useState<number[]>(state==='complete'?[0,1,2,3,4]:[])
  const [editingRevision,setEditingRevision]=useState(false)
  const draftKey=`${language}:${step}:${step===3?interview:step===4?challenge:flow}`
  const draft=drafts[draftKey]||''
  const update=(value:string)=>setDrafts(d=>({...d,[draftKey]:value}))
  const switchState=(value:string)=>{setView(value);setError('');if(step===3)setInterviewStates(s=>({...s,[interview]:value}));if(value==='complete')setCompleted([0,1,2,3,4]);if(value==='empty'){setStep(0);setCompleted([])}if(value==='lockedStep'&&step===0)setStep(1)}
  const loading=view==='loading'
  const policy=view==='policyPending'
  const denied=view==='locked'
  const unavailable=language!=='typescript'||view==='variantOrVersionUnavailable'
  const saved=['saved','streaming','feedbackReady','errorAfterSave','interrupted','resume','conflict','complete'].includes(view)
  const generating=view==='streaming'||(view==='resume'&&askState!=='resumed')
  const ready=view==='feedbackReady'||view==='complete'
  const allInterviewComplete=step!==3||view==='complete'||reference.interviewPrompts.every(q=>q.id===interview?ready:['feedbackReady','complete'].includes(interviewStates[q.id]))
  const canContinue=ready&&allInterviewComplete
  const selectedChallenge=reference.challengeDefinitions.find(c=>c.id===challenge)!
  const chooseStep=(index:number)=>{setStep(index);setError('');document.getElementById(`${prefix}practice`)?.scrollIntoView();requestAnimationFrame(()=>document.getElementById(`${prefix}practice-heading`)?.focus())}
  const submit=()=>{
    if(!draft.trim()){setError('Nhập câu trả lời của bạn trước khi gửi.');return}
    if(policy||denied||unavailable)return
    // Static direction: saving stays distinct from a durable acknowledgement.
    switchState('saving')
  }
  const textAnswer=(label:string,description?:string)=><Textarea label={label} name="answer" value={draft} onValueChange={update} rows={5} maxLength={12000} description={description} errorMessage={error||undefined} isSkeleton={loading} isRequired isReadOnly={saved||view==='saving'}/>
  const stepForm=<SurfaceCard label={steps[step][1]} headingLevel={3}>
    <div className={classes.stack}>
      <Text>{steps[step][2]}</Text>
      {view==='lockedStep'?<Alert tone="unavailable" appearance="soft" title="Bước này chưa mở" description={`Hoàn tất ${steps[Math.max(0,step-1)][1]} và xác nhận phản hồi bằng Continue trước.`}/>:<Form label={steps[step][1]} onSubmit={submit} isPending={view==='saving'}>
        <div className={classes.stack}>
          {editingRevision&&view==='draft'&&<Alert tone="neutral" appearance="soft" title="Đang chỉnh sửa câu trả lời" description="Lưu sẽ tạo revision mới và mở lại bước này. Phản hồi trước thuộc revision cũ; câu trả lời ở các bước sau được giữ."/>}
          {step===0&&<>{textAnswer('Tóm tắt hợp đồng chính','Tự viết phần tóm tắt và chọn ít nhất một mục gốc để dẫn chứng.')}<Select label="Mục tham chiếu" name="sectionIds" options={sectionOptions} value={sections[0]} onValueChange={v=>setSections(v?[v]:[])} isSkeleton={loading}/></>}
          {step===1&&<>{textAnswer('Giải thích khái niệm','Giải thích status code, PUT/PATCH và tính idempotent.')}<CheckboxGroup label="HTTP verb cần giải thích" options={['POST','GET','PUT','PATCH','DELETE'].map(value=>({value,label:value}))} value={verbs} onValueChange={setVerbs}/>{verbs.map(verb=><div className={classes.stack} key={verb}><SectionHeader title={verb} level={4}/><Input id={`operation-${verb}`} name={`operation-${verb}`} label="Thao tác trên resource"/><NumberField label="Status code" name={`status-${verb}`} minValue={100} maxValue={599}/><Textarea label="Lý do retry an toàn hoặc không an toàn" name={`retryReason-${verb}`} rows={2}/></div>)}</>}
          {step===2&&<><RadioGroup label="Luồng gốc" value={flow} onValueChange={v=>{setFlow(v);switchState('draft')}} options={authoredFlows}/>{textAnswer('Trace request qua code gốc','Nêu các touchpoint của request trong code TypeScript.')}<NumberField label="HTTP status quan sát được" name="observedStatus" minValue={100} maxValue={599}/><Textarea label="Response body quan sát được" name="observedBody" rows={3} description="Cho phép body rỗng với 204."/><Textarea label="Bằng chứng chạy — tùy chọn" name="runEvidence" rows={3} description="Dán output bạn thực sự quan sát. StarCi không khẳng định đã chạy demo."/></>}
          {step===3&&<><RadioGroup label="Ba câu hỏi phỏng vấn gốc" value={interview} onValueChange={v=>{setInterviewStates(s=>({...s,[interview]:view}));setInterview(v);setView(interviewStates[v]||'draft');setError('')}} options={reference.interviewPrompts.map(q=>({value:q.id,label:inline(marked.Lexer.lexInline(q.prompt.replace(/^-\s+/,''))),description:view==='complete'?'Phản hồi hoàn tất':(q.id===interview?ready:['feedbackReady','complete'].includes(interviewStates[q.id]))?'Phản hồi hoàn tất — chỉ câu hỏi này':'Câu trả lời và phản hồi được lưu riêng cho câu hỏi này.'}))}/>{textAnswer('Câu trả lời của bạn','Chỉ câu hỏi đã có câu trả lời được lưu mới đủ điều kiện nhận phản hồi.')}</>}
          {step===4&&<><RadioGroup label="Chọn một challenge gốc" value={challenge} onValueChange={v=>{setChallenge(v);switchState('draft')}} options={reference.challengeDefinitions.map(c=>({value:c.id,label:c.title,description:c.difficulty.trim()}))}/><Source source={selectedChallenge.description}/><Accordion label="Yêu cầu và điều kiện của challenge" allowsMultipleExpanded items={[...selectedChallenge.requirements.map(r=>({id:r.id,title:r.title,content:<Source source={r.body}/>})),{id:'prerequisites',title:'Điều kiện tiên quyết',content:<Source source={selectedChallenge.prerequisites.map(p=>`- ${p.text}`).join('\n')}/>}]}/><Text size="sm">Loại bài nộp: GitHub URL · Ngôn ngữ: {languageNames[language]}</Text><Input id="github-url" name="url" label="GitHub URL" description="URL HTTPS của repository theo yêu cầu challenge." isRequired/>{textAnswer('Giải thích bài nộp','Trình bày cách triển khai và dẫn tới artifact bạn đã nộp.')}</>}
          {view==='errorBeforeSave'&&<Alert tone="negative" appearance="soft" title="Chưa lưu được câu trả lời" description="Bản nháp vẫn còn. Thử lưu lại cùng yêu cầu; chưa gửi sang coach."/>}
          {saved&&<><Text live="polite" weight="semibold">Saved · answer revision 2 · progress revision 7</Text><Text size="sm" tone="muted">Câu trả lời đã lưu: {draft||'Nội dung câu trả lời của bạn được giữ tại đây.'}</Text></>}
          {view==='conflict'&&<><Alert tone="cautionary" appearance="soft" title="Có phiên bản mới từ phiên học khác" description="Bản nháp cục bộ được giữ riêng. Chọn cách đối chiếu trước khi lưu."/><Textarea label="Bản nháp cục bộ" value={draft} onValueChange={update} rows={3}/><Textarea label="Câu trả lời mới nhất — server revision 3" value="Nội dung câu trả lời mới nhất từ phiên học khác." isReadOnly rows={3}/><Button intent="commit" onPress={()=>{setEditingRevision(true);switchState('draft')}}>Đối chiếu và chỉnh sửa</Button></>}
          {generating&&<><Text live="polite">Generating · phản hồi đang tạo, chưa hoàn tất</Text><Skeleton lines={3}/><Text size="sm" tone="muted">Phần trả lời tạm thời xuất hiện tại đây; chưa tính hoàn thành.</Text><Button intent="dismiss" onPress={()=>switchState('interrupted')}>Cancel</Button></>}
          {(view==='errorAfterSave'||view==='interrupted')&&<><Alert tone="negative" appearance="soft" title={view==='interrupted'?'Phản hồi chưa hoàn tất':'Coach tạm thời không khả dụng'} description="Câu trả lời đã lưu vẫn còn. Phần phản hồi tạm thời không được tính hoàn thành; thử lại sẽ thay thế phần chưa hoàn tất."/><Text size="sm" tone="muted">Nếu server trả retryAt, hiển thị thời điểm được thử lại tại đây.</Text></>}
          {ready&&<Region label="Phản hồi cho câu trả lời đã lưu"><SectionHeader title="Phản hồi" level={4}/><Text>Phản hồi cho đúng câu trả lời và phiên bản đã lưu xuất hiện tại đây.</Text><Link href={`#${ap}section-2.2.1`}>2.2.1. Bản chất</Link><Text size="sm" tone="muted">Chỉ phản hồi cho câu trả lời này. Những câu hỏi khác cần được trả lời riêng.</Text></Region>}
          {policy&&<Text size="sm" tone="muted">Đang chờ quyết định về năm bước và chính sách AI. Bạn vẫn đọc bài gốc được.</Text>}
          <div className={classes.actions}>
            {saved&&!generating&&view!=='conflict'&&<Button intent="neutral" onPress={()=>{setEditingRevision(true);setCompleted(c=>c.filter(i=>i!==step));switchState('draft')}}>Chỉnh sửa thành revision mới</Button>}
            {saved&&!generating&&!ready&&view!=='conflict'&&<Button intent="commit" onPress={()=>switchState('streaming')}>{view==='saved'?'Request feedback':'Retry feedback'}</Button>}
            {!saved&&<Button intent="commit" type="submit" isPending={view==='saving'} isDisabled={policy||unavailable} disabledReason={policy?'Chờ duyệt chính sách coaching.':'Chọn biến thể có sẵn.'} width="fill">{view==='errorBeforeSave'?'Retry save':'Submit answer'}</Button>}
            {saved&&view!=='conflict'&&view!=='complete'&&<Button intent={canContinue?'commit':'neutral'} isDisabled={!canContinue} disabledReason="Cần phản hồi hoàn chỉnh cho tất cả mục bắt buộc của bước; phỏng vấn cần đủ ba câu hỏi." onPress={()=>{setCompleted(c=>[...new Set([...c,step])]);if(step<4){chooseStep(step+1);switchState('draft')}else switchState('complete')}}>Continue</Button>}
          </div>
          {saved&&<Text size="sm" tone="muted">Chỉnh sửa mở lại bước này; phản hồi cũ thuộc revision trước, các câu trả lời ở bước sau được giữ. Bước phỏng vấn cần đủ ba phản hồi hoàn tất.</Text>}
        </div>
      </Form>}
    </div>
  </SurfaceCard>
  const rail=<Region label="Thực hành cùng bài gốc" id={`${prefix}practice`}><div className={classes.stack}>
    <div id={`${prefix}practice-heading`} tabIndex={-1}><SectionHeader title="Năm bước thực hành" description="Đề xuất trình tự học · bài gốc luôn ở phía trên"/></div>
    <Text isSkeleton={loading}>{view==='complete'?'5':completed.length} / 5 bước hoàn tất</Text>
    <Progress label="Số bước đã hoàn tất" value={view==='complete'?100:completed.length*20} isSkeleton={loading}/>
    <Stepper label="Tiến trình bài học" orientation="vertical" currentStepId={steps[step][0]} isLoading={loading} steps={steps.map((s,i)=>({id:s[0],label:s[1],state:view==='complete'||completed.includes(i)?'complete':i===step?'current':'upcoming',isDisabled:i>step&&!completed.includes(i)&&view!=='complete',description:completed.includes(i)||view==='complete'?'Đã hoàn tất — có thể xem lại':i===step?'Bước hiện tại':i>step?`Chưa mở — hoàn tất ${steps[i-1][1]} trước.`:'Có thể xem lại'}))} onStepSelect={id=>chooseStep(steps.findIndex(s=>s[0]===id))} stateLabel={state=>({complete:'Đã hoàn tất',current:'Hiện tại',upcoming:'Chưa hoàn tất',error:'Có lỗi'}[state])}/>
    {stepForm}
    <Link href={`#${ap}article-original`}>Về bài viết gốc</Link>
    <Region label="Hỏi StarCi" id={`${prefix}ask-starci`}><SurfaceCard label="Hỏi StarCi" headingLevel={3}><Form label="Hỏi về bài gốc" onSubmit={()=>{if(!policy&&!unavailable&&question.trim())setAskState('streaming')}}><div className={classes.stack}>
      <Select label="Phạm vi mục nguồn" options={sectionOptions} value={scope} onValueChange={v=>setScope(v||'section-1')} isSkeleton={loading}/>
      <Textarea label="Câu hỏi của bạn" name="question" value={question} onValueChange={setQuestion} rows={3} maxLength={2000} isSkeleton={loading} description="Câu trả lời dựa trên mục nguồn đã chọn; không làm tăng tiến độ."/>
      {askState==='streaming'?<><Text live="polite">Generating · câu trả lời chưa hoàn tất</Text><Skeleton lines={3}/><Button intent="dismiss" onPress={()=>setAskState('interrupted')}>Cancel</Button></>:<Button intent="neutral" type="submit" isDisabled={policy||unavailable} disabledReason="Coaching chờ chính sách được duyệt và biến thể có sẵn.">{askState==='interrupted'?'Retry question':'Gửi câu hỏi'}</Button>}
      {askState==='interrupted'&&<Alert tone="unavailable" appearance="soft" title="Câu trả lời bị ngắt" description="Giữ câu hỏi của bạn. Thử lại để thay thế phần trả lời chưa hoàn tất."/>}
      <Text size="sm" tone="muted">Phản hồi có dẫn nguồn xuất hiện ở đây. Không thay bài gốc bằng hội thoại.</Text>
      <Link href={`#${ap}${scope}`}>{reference.outline.find(s=>s.id===scope)?.text}</Link>
    </div></Form></SurfaceCard></Region>
  </div></Region>
  const body=view==='notFound'?<EmptyNotice message="Không tìm thấy bài học" description="Bài hoặc phiên bản này không còn sẵn có." actionLabel="Quay lại danh sách bài" onAction={()=>location.assign('/vi/lessons')}/>:<>
          <Region label="Ngôn ngữ lập trình"><div className={classes.stack}><SegmentedControl label="Ngôn ngữ lập trình" description="TS = TypeScript. Đổi ngôn ngữ mở phần thực hành được lưu riêng; ngôn ngữ lập trình khác với ngôn ngữ giao diện." value={language} onValueChange={setLanguage} options={languageOptions}/><Text size="sm" tone="muted">Đang xem: {languageNames[language]} · Tiếng Việt</Text></div></Region>
          {policy&&<Alert tone="neutral" title="Coaching đang chờ duyệt" description="Trình tự năm bước và chính sách AI chưa được quyết định. Bài gốc vẫn đọc được; gửi câu trả lời và Hỏi StarCi tạm khóa."/>}
          {view==='resume'&&<Alert tone="neutral" title="Đã khôi phục phiên học" description="Giữ phiên bản, TypeScript, vi, bước hiện tại, revision 2 và vị trí đọc. Lần tạo phản hồi đang chạy được hiển thị trước khi cho phép gửi lại."/>}
          {unavailable?<EmptyNotice message="Không thể mở biến thể hoặc phiên bản đã chọn" description="Tiến độ đã lưu được giữ nguyên. Chọn biến thể có sẵn hoặc bắt đầu rõ ràng với phiên bản mới; không chuyển câu trả lời cũ sang nguồn mới." actionLabel="Xem TypeScript / vi" onAction={()=>{setLanguage('typescript');switchState('draft')}}/>:<>
            <Region label="Mục lục bài gốc"><div className={classes.stack}><Disclosure title="Mục lục bài gốc" summary="20 mục" isExpanded={outlineOpen} onExpandedChange={setOutlineOpen}><List label="Các mục nguyên bản">{reference.outline.map(s=><ListRow key={s.id} title={<Link href={`#${ap}${s.id}`} isDisabled={denied&&s.id!=='section-1'}>{s.text}</Link>}/>)}</List></Disclosure>{denied?<Text size="sm" tone="muted">Bản xem trước chỉ mở mục 1; những mục còn lại chưa được cấp quyền.</Text>:<div className={classes.actions}><Link href={`#${prefix}practice`}>Đến năm bước thực hành</Link><Link href={`#${prefix}ask-starci`}>Hỏi StarCi</Link></div>}</div></Region>
            <PrimaryRailLayout railWidth="compact" collapsedOrder="primary-first" primary={<article id={`${ap}article-original`} aria-label="Bài viết gốc"><Source source={denied?reference.section1:reference.publicArticle} loading={loading} prefix={ap}/>{denied&&<EmptyNotice message="Phần xem trước kết thúc ở mục 1" description="Bạn chưa có quyền truy cập phần còn lại. Mục lục được giữ; coaching chưa khả dụng." actionLabel="Về danh sách bài" onAction={()=>location.assign('/vi/lessons')}/>}</article>} rail={denied?undefined:rail}/>
          </>}
        </>
  if(part==='rail')return rail
  if(part==='form')return stepForm
  if(part==='body')return body
  return <SiteShell brand="app.shell.brand" homeHref="/">
    <Page measure="reading" isSkeleton={loading} header={{title:'academy-rest-semantics',description:'HTTP verb · status code · idempotency',meta:'20 phút đọc · Ngày xác minh nguồn: 2026-06-02 · Tiếng Việt'}}>{body}</Page>
  </SiteShell>
}
// Each state is drawn once under the page: page-level states draw the page body, progress states the whole coaching
// rail, and answer states only the step's form, which is all that changes between them.
const bodyStates=['loading','locked','notFound','variantOrVersionUnavailable']
const railStates=['empty','lockedStep','complete']
const previews:{id:string,label:string,state:string,step:number,part:Part}[]=[
  ...states.filter(s=>s!=='policyPending').map(s=>({id:s,label:names[s],state:s,step:s==='lockedStep'?3:0,part:(bodyStates.includes(s)?'body':railStates.includes(s)?'rail':'form') as Part})),
  ...steps.slice(1).map((s,i)=>({id:`form-${i+2}`,label:`Bước ${i+2} · ${s[1]}`,state:'draft',step:i+1,part:'form' as Part})),
  {id:'interview-feedback',label:'Phỏng vấn · một câu có phản hồi, Continue chờ đủ ba câu',state:'feedbackReady',step:3,part:'form'},
]
const darkPreview={id:'streaming-dark',label:'Đang tạo phản hồi · giao diện tối'}
const Preview=({id,label,children}:{id:string,label:string,children:React.ReactNode})=><Region id={`state-${id}`} label={label}><div className={classes.stack}><SectionHeader title={label} level={2}/>{children}</div></Region>
export function Direction(){
  return <>
    <CoreGrammarRoot theme="light">
      <App/>
      <aside aria-label="Direction review · static states" className={classes.review}><div className={classes.stack}>
        <SectionHeader title="Direction review · static states" description="Trang trên ở trạng thái Chính sách đang chờ duyệt. Mỗi trạng thái khác được vẽ sẵn bên dưới; không có lưu trữ, gọi AI hay dữ liệu chấm điểm. Nội dung nguồn TypeScript/vi là dữ liệu công khai." level={2}/>
        <List label="Các trạng thái được vẽ">{[...previews,darkPreview].map(p=><ListRow key={p.id} title={<Link href={`#state-${p.id}`}>{p.label}</Link>}/>)}</List>
        {previews.map(p=><Preview key={p.id} id={p.id} label={p.label}><App state={p.state} initialStep={p.step} part={p.part} prefix={`${p.id}-`}/></Preview>)}
      </div></aside>
    </CoreGrammarRoot>
    <CoreGrammarRoot theme="dark">
      <aside aria-label="Direction review · dark theme" className={classes.review}><Preview id={darkPreview.id} label={darkPreview.label}><App state="streaming" part="rail" prefix={`${darkPreview.id}-`}/></Preview></aside>
    </CoreGrammarRoot>
  </>
}
