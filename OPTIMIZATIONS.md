# Otimizações Futuras

Este documento descreve otimizações de performance que podem ser implementadas no futuro para melhorar a escalabilidade da aplicação.

## Paginação no Hook `useSupabaseData`

**Problema Atual:**
O hook `useSupabaseData` atualmente busca todos os registros de uma tabela de uma só vez. Em tabelas com um grande volume de dados (ex: `pacotes`, `motoristas`, `veiculos`), isso pode causar lentidão no carregamento e um alto consumo de memória e banda.

**Solução Proposta:**
Implementar paginação no hook `useSupabaseData` para buscar os dados em blocos (chunks).

**Passos para Implementação:**

1.  **Modificar `useSupabaseData`:**
    *   Adicionar parâmetros opcionais `page` (página atual, default: 1) e `pageSize` (itens por página, default: 20) às opções do hook.
    *   Utilizar o método `.range(from, to)` do Supabase para buscar apenas o intervalo de registros correspondente à página atual.
        *   `from = (page - 1) * pageSize`
        *   `to = from + pageSize - 1`

2.  **Retornar Contagem Total:**
    *   Para que a UI possa renderizar os controles de paginação, o hook precisará retornar a contagem total de registros na tabela. Isso pode ser feito com uma segunda query usando `{ count: 'exact' }`.

3.  **Atualizar a UI:**
    *   Nos componentes que utilizam tabelas (`Agencies`, `Vehicles`, `Drivers`, etc.), adicionar controles de paginação (ex: botões "Próxima Página", "Página Anterior", indicador "Página X de Y").
    *   Gerenciar o estado da página atual no componente e passá-lo para o hook `useSupabaseData`.

**Impacto:**

*   **Performance:** Redução drástica no tempo de carregamento inicial das páginas com listagens extensas.
*   **UX:** A aplicação se tornará mais responsiva e fluida, mesmo com um grande volume de dados.
*   **Recursos:** Diminuição do consumo de memória no navegador e da carga no banco de dados.