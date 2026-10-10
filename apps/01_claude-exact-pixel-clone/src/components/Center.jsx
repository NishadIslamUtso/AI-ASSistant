import { useState, useEffect, useRef } from 'react'
export default function Center({ chats, currentChat, messages, setMessages, setChats, showVault, setShowVault }) {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [vaultContext, setVaultContext] = useState([])
  const endRef = useRef(null)
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}) }, [messages])
  useEffect(()=>{
    if (input.length<3){ setVaultContext([]); return }
    const t=setTimeout(async()=>{
      try{
        const res=await fetch(`http://127.0.0.1:8765/context?q=${encodeURIComponent(input.slice(-80))}`)
        if(res.ok){ const data=await res.json(); setVaultContext((data.capsules||[]).slice(0,3)) }
      }catch(e){}
    },500)
    return()=>clearTimeout(t)
  },[input])
  async function send(){
    if(!input.trim()||isLoading) return
    const userMsg=input.trim()
    const userMessage={role:'user', content:userMsg, id:Date.now().toString()}
    setMessages(prev=>[...prev, userMessage])
    setInput(""); setVaultContext([])
    try{
      await fetch('http://127.0.0.1:8765/capture',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({type:'conversation', provider:'AI ASSistant', title:userMsg.slice(0,50), messages:[{role:'user', text:userMsg, timestamp:new Date().toISOString()}], completeness:'full', captured_at:new Date().toISOString()})})
    }catch(e){}
    setIsLoading(true)
    try{
      let vaultInjection=""
      if(vaultContext.length>0) vaultInjection="\n\nRelevant vault memory:\n"+vaultContext.map(c=>`[${c.title}: ${c.background?.slice(0,200)}]`).join("\n")+"\n"
      const res=await fetch('http://127.0.0.1:11434/api/chat',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({model:'qwen2.5:3b', messages:[{role:'system', content:`You are AI ASSistant, helpful local AI. Use AI-Brain vault as memory. Prefer simple step-by-step. User is Utso. Only create code when explicitly asked.`}, ...messages.map(m=>({role:m.role, content:m.content})), {role:'user', content:userMsg+vaultInjection}], stream:true})})
      if(!res.ok) throw new Error('Ollama not responding')
      const reader=res.body.getReader()
      const decoder=new TextDecoder()
      let assistantContent=""
      const assistantMsg={role:'assistant', content:'', id:(Date.now()+1).toString()}
      setMessages(prev=>[...prev, assistantMsg])
      while(true){
        const {done, value}=await reader.read()
        if(done) break
        const chunk=decoder.decode(value)
        const lines=chunk.split('\n').filter(l=>l.trim())
        for(const line of lines){
          try{
            const json=JSON.parse(line)
            if(json.message?.content){ assistantContent+=json.message.content; setMessages(prev=>prev.map(m=> m.id===assistantMsg.id ? {...m, content:assistantContent} : m)) }
          }catch(e){}
        }
      }
    }catch(e){
      setMessages(prev=>[...prev, {role:'assistant', content:`Error: ${e.message}. Check Ollama at 11434 and OLLAMA_ORIGINS=*`, id:Date.now().toString()}])
    }finally{ setIsLoading(false) }
  }
  return (
    <div className="flex-1 flex flex-col bg-[#1a1a1a] h-screen">
      <div className="h-11 flex items-center justify-between px-4 border-b border-[#2a2a2a] shrink-0">
        <div></div>
        <div className="flex items-center gap-2"><div className="bg-[#2a2a2a] rounded-full px-3 py-1 text-xs flex items-center gap-2"><span className="text-[#aaa]">Free plan</span><span className="text-[#6b9bff]">· Upgrade</span></div></div>
      </div>
      <div className="flex-1 overflow-y-auto flex flex-col items-center">
        {messages.length===0 ? (
          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl px-6">
            <div className="flex items-center gap-3 mb-8"><div className="w-8 h-8 rounded-full bg-[#ff6b35] flex items-center justify-center">✳</div><h1 className="text-3xl serif">Evening, Utso</h1></div>
            <div className="w-full bg-[#242424] border border-[#333] rounded-xl p-3">
              <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); send(); } }} placeholder="How can I help you today?" className="w-full bg-transparent resize-none outline-none text-[15px] min-h-[24px] placeholder-[#666]" rows={1} />
              <div className="flex items-center justify-between mt-3"><button className="w-7 h-7 rounded-full bg-[#2a2a2a] border border-[#333] flex items-center justify-center text-[#888]">+</button><div className="flex items-center gap-3 text-[#666]">🎤 〰</div></div>
            </div>
            <div className="flex items-center justify-between w-full mt-3 text-xs"><div className="text-[#aaa]">Project ⌄</div><div className="flex gap-3 text-[#666]"><span>Sonnet 5.5</span><span>Medium</span><span>Manual</span></div></div>
          </div>
        ) : (
          <div className="w-full max-w-2xl px-6 py-8 space-y-6">
            {messages.map(m=><div key={m.id} className={`flex gap-3 ${m.role==='user'?'justify-end':''}`}>{m.role==='assistant' && <div className="w-6 h-6 rounded-full bg-[#ff6b35] flex items-center justify-center text-[10px] shrink-0">✳</div>}<div className={`${m.role==='user'?'bg-[#2a2a2a] rounded-2xl px-4 py-2 max-w-[80%]':''} text-[15px] leading-6 whitespace-pre-wrap`}>{m.content}</div>{m.role==='user' && <div className="w-6 h-6 rounded-full bg-[#c4a484] flex items-center justify-center text-xs shrink-0">N</div>}</div>)}
            {isLoading && <div className="flex gap-3"><div className="w-6 h-6 rounded-full bg-[#ff6b35] flex items-center justify-center text-[10px]">✳</div><div className="text-[#666] text-sm">Thinking...</div></div>}
            <div ref={endRef} />
            <div className="sticky bottom-0 bg-[#1a1a1a] pt-4">
              <div className="bg-[#242424] border border-[#333] rounded-xl p-3"><textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); send(); } }} placeholder="Reply..." className="w-full bg-transparent resize-none outline-none text-[15px] min-h-[24px] placeholder-[#666]" rows={1} /><div className="flex justify-between mt-3"><div className="text-[#666] text-xs">◍ 📎 📷</div><div className="flex items-center gap-2"><span className="text-[10px] text-[#666]">qwen2.5:3b</span><button onClick={send} className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center">↑</button></div></div><div className="mt-2 bg-[#2a2a2a] rounded-full py-1 text-center text-[11px] text-[#666]">Cook This Prompt</div></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
