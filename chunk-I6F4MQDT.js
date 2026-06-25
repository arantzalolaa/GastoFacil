import{a as h}from"./chunk-NB5ZOTHR.js";import{hb as c,l as p}from"./chunk-UESOOO3C.js";import{a as m,b as d,f as r}from"./chunk-ZY7WU73K.js";var g=(()=>{let t=class t{constructor(){this.supabase=h(c.supabaseUrl,c.supabaseKey)}obtenerGastos(){return r(this,null,function*(){let{data:a,error:o}=yield this.supabase.schema("GastoFacil").from("gastos").select(`
        id,
        categoria_id,
        concepto,
        monto,
        fecha,
        metodo_pago,
        notas,
        categorias (
          nombre,
          icono,
          color,
          activa
        )
      `).order("fecha",{ascending:!1});if(o)throw o;return(a??[]).map(e=>this.mapearGasto(e))})}crearGasto(a){return r(this,null,function*(){let{data:{user:o},error:e}=yield this.supabase.auth.getUser();if(e||!o)throw new Error("No hay usuario autenticado.");let{data:s,error:n}=yield this.supabase.schema("GastoFacil").from("gastos").insert(d(m({},a),{user_id:o.id})).select(`
        id,
        categoria_id,
        concepto,
        monto,
        fecha,
        metodo_pago,
        notas,
        categorias (
          nombre,
          icono,
          color,
          activa
        )
      `).single();if(n)throw n;return this.mapearGasto(s)})}actualizarGasto(a,o){return r(this,null,function*(){let{data:e,error:s}=yield this.supabase.schema("GastoFacil").from("gastos").update(o).eq("id",a).select(`
        id,
        categoria_id,
        concepto,
        monto,
        fecha,
        metodo_pago,
        notas,
        categorias (
          nombre,
          icono,
          color,
          activa
        )
      `).single();if(s)throw s;return this.mapearGasto(e)})}eliminarGasto(a){return r(this,null,function*(){let{error:o}=yield this.supabase.schema("GastoFacil").from("gastos").delete().eq("id",a);if(o)throw o})}mapearGasto(a){let o=Array.isArray(a.categorias)?a.categorias[0]??null:a.categorias;return{id:a.id,categoria_id:a.categoria_id,categoria:o,concepto:a.concepto,monto:Number(a.monto),fecha:a.fecha,metodo_pago:a.metodo_pago,notas:a.notas}}};t.\u0275fac=function(o){return new(o||t)},t.\u0275prov=p({token:t,factory:t.\u0275fac,providedIn:"root"});let i=t;return i})();export{g as a};
