const Store = (() => {
  const prefix='breizhBalade:';
  const currentUserId=()=>{try{return String(window.BreizhAuth?.currentAccount?.()?.email||'').trim().toLowerCase();}catch(_){return '';}};
  const scopedKey=key=>currentUserId()?`${prefix}user:${encodeURIComponent(currentUserId())}:${key}`:null;
  const readJSON=(k,f)=>{try{const raw=localStorage.getItem(k);return raw?JSON.parse(raw):f;}catch(_){return f;}};
  const read=(key,fallback)=>{const target=scopedKey(key);if(!target)return fallback;try{const existing=localStorage.getItem(target);if(existing!=null)return readJSON(target,fallback);const legacyKey=prefix+key,legacy=localStorage.getItem(legacyKey);if(legacy!=null){localStorage.setItem(target,legacy);localStorage.removeItem(legacyKey);return JSON.parse(legacy);}}catch(_){}return fallback;};
  const write=(key,value)=>{const target=scopedKey(key);if(!target)return false;try{localStorage.setItem(target,JSON.stringify(value));return true;}catch(_){return false;}};
  const toggleInArray=(key,id)=>{const list=read(key,[]);const next=list.includes(id)?list.filter(x=>x!==id):[...list,id];write(key,next);return next.includes(id);};
  return {read,write,all:()=>({favorites:read('favorites',[]),later:read('later',[]),visited:read('visited',[]),notes:read('notes',{})}),isFavorite:id=>read('favorites',[]).includes(id),isLater:id=>read('later',[]).includes(id),isVisited:id=>read('visited',[]).includes(id),toggleFavorite:id=>toggleInArray('favorites',id),toggleLater:id=>toggleInArray('later',id),toggleVisited:id=>toggleInArray('visited',id),getNote:id=>read('notes',{})[id]||'',setNote:(id,note)=>{const notes=read('notes',{});notes[id]=note;return write('notes',notes);}};
})();
