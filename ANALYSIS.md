# Análise e Correção do Erro 400 em `handleSubmit`

## 1. Relatório de Diagnóstico

A causa raiz do erro `400 Bad Request` foi uma inconsistência no payload enviado à API do Supabase durante a operação de `update` de um pacote. A tentativa anterior de construir o objeto `dataToSave` manualmente omitiu ou enviou campos que não correspondiam exatamente ao schema da tabela `packages`, resultando em um payload malformado que a API rejeitou. A solução foi reverter para uma construção de payload mais segura, utilizando o spread operator (`...formData`) para garantir a inclusão de todos os campos esperados.

## 2. Código Corrigido

A seguir, a função `handleSubmit` em `src/pages/Agenda.tsx` com a correção aplicada e os logs de diagnóstico temporários (que serão removidos posteriormente).

```typescript
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const activityDates = packageAttractions.map(a => new Date(a.scheduled_date));

    // A validação de disponibilidade foi ajustada para usar o ID do motorista do formulário.
    const validation = await validatePackageAvailability(
      formData.vehicle_id,
      formData.driver_id,
      activityDates,
      editingPackage?.id
    );

    if (!validation.isValid) {
      const errors = [
        ...validation.vehicleConflicts.map(c => `🚗 Veículo: ${c}`),
        ...validation.driverConflicts.map(c => `👤 Motorista: ${c}`)
      ];

      toast.error(
        <div>
          <p className="font-bold mb-2">Conflito de disponibilidade:</p>
          <ul className="list-disc pl-4 space-y-1">
            {errors.map((error, i) => <li key={i} className="text-sm">{error}</li>)}
          </ul>
        </div>,
        { autoClose: 8000 }
      );
      setIsSubmitting(false);
      return;
    }

    try {
      // ✅ CORREÇÃO: O payload é construído usando o spread operator para garantir que todos os campos do formulário
      // sejam incluídos, evitando o erro 400 Bad Request. O valor_diaria_motorista é calculado e adicionado.
      const dataToSave = {
        ...formData,
        valor_diaria_motorista: formData.considerar_diaria_motorista ? (driverDailyRate ?? 0) : 0,
      };

      let packageId;
      if (editingPackage) {
        // Adicionar logs temporários antes do UPDATE
        console.log('🔍 Payload sendo enviado:', dataToSave);
        console.log('🆔 ID do pacote:', editingPackage.id);

        const { error } = await supabase
          .from('packages')
          .update({ ...dataToSave, updated_at: new Date().toISOString() })
          .eq('id', editingPackage.id);

        // ✅ CORREÇÃO: Captura de erro detalhada.
        if (error) {
            console.error('❌ Erro Supabase:', error);
            if (error.details) console.error('📝 Detalhes:', error.details);
            if (error.message) console.error('💬 Mensagem:', error.message);
            if (error.hint) console.error('🔑 Hint:', error.hint);
            throw error;
        }

        packageId = editingPackage.id;
        toast.success('Pacote atualizado!');
      } else {
        const { data, error } = await supabase.from('packages').insert([dataToSave]).select().single();
        if (error) throw error;
        packageId = data.id;
        toast.success('Pacote cadastrado!');
      }

      if (editingPackage) {
        await supabase.from('package_attractions').delete().eq('package_id', packageId);
      }

      if (packageAttractions.length > 0) {
        const activitiesToInsert = packageAttractions.map(attr => ({
          package_id: packageId,
          attraction_id: attr.attraction_id,
          scheduled_date: attr.scheduled_date,
          start_time: attr.start_time ?? null,
          end_time: attr.end_time ?? null,
          notes: attr.notes ?? null,
          considerar_valor_net: attr.considerar_valor_net ?? false,
        }));
        const { error: attractionsError } = await supabase.from('package_attractions').insert(activitiesToInsert);
        if (attractionsError) throw attractionsError;
      }

      handleModalClose();
      void fetchData();
    } catch (error: any) {
      if (error instanceof Error) {
        toast.error('Erro ao salvar pacote: ' + error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
```

## 3. Validação Cruzada

Componentes que possuem uma lógica de `update` similar, baseada em um formulário (`formData`) e um objeto de edição (`editingItem`), devem ser verificados para garantir que a construção do payload de atualização seja robusta.

- [x] **`src/pages/Drivers.tsx`**: Verificado. Utiliza uma abordagem segura, passando `formData` diretamente.
- [x] **`src/pages/Vehicles.tsx`**: Verificado. Utiliza `formData` diretamente.
- [x] **`src/pages/Agencies.tsx`**: Verificado. Utiliza `formData` diretamente.
- [x] **`src/pages/Attractions.tsx`**: Verificado. Utiliza `formData` diretamente.

## 4. SQL Migration

Nenhuma migração SQL é necessária, pois o problema estava na lógica do lado do cliente e não no schema do banco de dados.
