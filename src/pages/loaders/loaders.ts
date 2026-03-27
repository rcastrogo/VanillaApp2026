
import type { ComponentContext } from '@/components/component.model';

// =====================================================================
// Carga asíncrona total de la página, incluyendo su lógica de negocio
// =====================================================================  
export const asyncLoaderSample = async () => {
  const [pageModule, logicModule] = await Promise.all([
    import('../samples/async/terms.page'),
    import('../samples/async/terms.logic')
  ]);
  const users = await logicModule.loadUsers();
  console.log('Usuarios cargados en el router:', users);
  const creator = (ctx: ComponentContext) => {
    return new pageModule.default({ ...ctx, users });
  };
  return { default: creator };
}