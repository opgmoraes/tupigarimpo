import { describe,expect,it } from 'vitest';
import { parseRecord,titleOf } from './records';
describe('record input',()=>{
  it('preserves field types',()=>expect(parseRecord('{"title":"Promoção","price":0,"active":false}')).toEqual({title:'Promoção',price:0,active:false}));
  it.each(['null','[]','"text"','9','{'])('rejects invalid record %s',v=>expect(()=>parseRecord(v)).toThrow());
  it.each(['telegram_token','password','api_key','clientSecret'])('rejects credential field %s',k=>expect(()=>parseRecord(JSON.stringify({[k]:'private'}))).toThrow());
  it('does not interpret markup',()=>expect(titleOf({name:'<script>bad</script>'})).toBe('<script>bad</script>'));
  it('rejects credentials nested inside arrays',()=>expect(()=>parseRecord('{"settings":[{"bot_token":"private"}]}')).toThrow());
});
