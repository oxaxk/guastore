import assert from 'node:assert/strict';
import { mockProducts } from '../src/data/mockData';
import { normalizeCart, normalizeCartEntry, parseStoredCart, MAX_CART_QUANTITY } from '../src/lib/cart-policy';
import { calculateCart } from '../src/lib/commerce';

const raw = (p = mockProducts[0]) => ({ id:p.id, variantId:p.variants[0].id, title:p.title, variantTitle:p.variants[0].title, image:p.image, handle:p.handle, price:p.price, quantity:1 });
let checks = 0;
for (const value of [null, {}, '[]', [null], new Array(21).fill(raw())]) { assert.equal(normalizeCart(value).length,0); checks++; }
for (const patch of [{title:{}},{variantTitle:[]},{image:{}},{id:2},{handle:'evil'},{variantId:'wrong'},{price:-1},{price:Infinity},{quantity:0},{quantity:-1},{quantity:1.5},{quantity:100000},{quantity:MAX_CART_QUANTITY+1}]) {
  assert.equal(normalizeCartEntry({...raw(),...patch}),null); checks++;
}
const tampered = normalizeCartEntry({...raw(), title:'<script>bad</script>', image:'https://evil.invalid/track', price:0.01});
assert.equal(tampered?.title,mockProducts[0].title); assert.equal(tampered?.image,mockProducts[0].image); assert.equal(tampered?.price,6.99); checks+=3;
for (const stored of ['{', JSON.stringify({items:[]}), ' '.repeat(20001), '💥'.repeat(10001)]) { assert.deepEqual(parseStoredCart(stored),[]); checks++; }
assert.equal(normalizeCart([raw(),raw()])[0].quantity,2);
assert.equal(normalizeCart([{...raw(),quantity:20},raw()])[0].quantity,20); checks+=2;
assert.deepEqual(calculateCart(normalizeCart([raw()])),{subtotal:6.99,shipping:1.99,total:8.98,stoneCount:1});
assert.deepEqual(calculateCart(normalizeCart([raw(),raw(mockProducts[1])])),{subtotal:12.98,shipping:0,total:12.98,stoneCount:2}); checks+=2;
assert.equal(normalizeCartEntry(raw(mockProducts[2])),null); checks++;
const digital = {...mockProducts[0],id:'digital',handle:'massage-guide',title:'Massage Guide',price:9,variants:[{...mockProducts[0].variants[0],id:'digital-v',price:9}]};
const digitalItems = normalizeCart([raw(digital)], [digital]);
assert.equal(digitalItems.length,1); assert.deepEqual(calculateCart(digitalItems),{subtotal:9,shipping:0,total:9,stoneCount:0}); checks+=2;
assert(Number.isFinite(calculateCart([{handle:'unknown',price:Infinity,quantity:1}]).total)); checks++;
console.log(JSON.stringify({status:'pass',gate:'cart-security',checks,noNetwork:true}));
