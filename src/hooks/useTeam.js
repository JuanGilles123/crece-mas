import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

// ============================================
// Hook para obtener información del rol del usuario
// ============================================
export const useUserRole = (userId) => {
  return useQuery({
    queryKey: ['userRole', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*, organizations(*)')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        throw new Error('Error al cargar rol del usuario');
      }

      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// ============================================
// Hook para obtener miembros del equipo
// ============================================
export const useTeamMembers = (organizationId) => {
  return useQuery({
    queryKey: ['teamMembers', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      // Obtener team_members SIN el join (por ahora)
      const { data: members, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('organization_id', organizationId)
        .order('joined_at', { ascending: false });

      if (error) {
        console.error('Error fetching team members:', error);
        throw new Error('Error al cargar miembros del equipo');
      }

      if (!members || members.length === 0) {
        return [];
      }

      // Obtener user_profiles por separado
      const userIds = members.map(m => m.user_id);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, phone, avatar_url, email')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Combinar manualmente
      return members.map(member => ({
        ...member,
        user_profiles: profiles?.find(p => p.user_id === member.user_id) || null,
        email: profiles?.find(p => p.user_id === member.user_id)?.email || 'No disponible'
      }));
    },
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

// ============================================
// Hook para obtener organización del usuario
// ============================================
export const useUserOrganization = (userId) => {
  return useQuery({
    queryKey: ['userOrganization', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      // Primero obtener el perfil del usuario para saber su organización
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('organization_id, role')
        .eq('user_id', userId)
        .single();

      if (profileError || !profile) {
        console.error('Error fetching user profile:', profileError);
        return null;
      }

      // Si no tiene organización asignada, buscar en team_members
      let orgId = profile.organization_id;
      
      if (!orgId) {
        const { data: membership } = await supabase
          .from('team_members')
          .select('organization_id')
          .eq('user_id', userId)
          .eq('status', 'active')
          .single();
        
        orgId = membership?.organization_id;
      }

      if (!orgId) return null;

      // Obtener la organización completa
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();

      if (orgError) {
        console.error('Error fetching organization:', orgError);
        throw new Error('Error al cargar organización');
      }

      return {
        ...organization,
        userRole: profile.role
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

// ============================================
// Hook para obtener permisos del usuario
// ============================================
export const useUserPermissions = (organizationId, userId) => {
  return useQuery({
    queryKey: ['userPermissions', organizationId, userId],
    queryFn: async () => {
      if (!organizationId || !userId) return { access: false };
      
      const { data, error } = await supabase
        .rpc('get_user_permissions', { org_id: organizationId });

      if (error) {
        console.error('Error fetching permissions:', error);
        return { access: false };
      }

      return data;
    },
    enabled: !!organizationId && !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

// ============================================
// Hook para obtener invitaciones pendientes
// ============================================
export const useInvitations = (organizationId) => {
  return useQuery({
    queryKey: ['invitations', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('organization_id', organizationId)
        .in('status', ['pending'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invitations:', error);
        throw new Error('Error al cargar invitaciones');
      }

      return data || [];
    },
    enabled: !!organizationId,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
};

// ============================================
// Hook para obtener invitaciones del usuario actual (como invitado)
// ============================================
export const useMyInvitations = (userEmail) => {
  return useQuery({
    queryKey: ['myInvitations', userEmail],
    queryFn: async () => {
      if (!userEmail) return [];
      
      const { data, error } = await supabase
        .from('team_invitations')
        .select(`
          *,
          organizations (
            name,
            business_type
          )
        `)
        .eq('email', userEmail)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching my invitations:', error);
        throw new Error('Error al cargar tus invitaciones');
      }

      return data || [];
    },
    enabled: !!userEmail,
    staleTime: 1 * 60 * 1000,
  });
};

// ============================================
// Mutación: Crear invitación
// ============================================
export const useCreateInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, email, role, message }) => {
      // Generar token único
      const token = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('team_invitations')
        .insert([{
          organization_id: organizationId,
          invited_by: user.id,
          email: email.toLowerCase(),
          role,
          token,
          message: message || null
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating invitation:', error);
        throw new Error(error.message || 'Error al crear invitación');
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['invitations', data.organization_id]);
      toast.success('Invitación enviada exitosamente');
    },
    onError: (error) => {
      console.error('Error creating invitation:', error);
      toast.error(error.message || 'Error al enviar invitación');
    },
  });
};

// ============================================
// Mutación: Aceptar invitación
// ============================================
export const useAcceptInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token) => {
      const { data, error } = await supabase
        .rpc('accept_invitation', { invitation_token: token });

      if (error) {
        console.error('Error accepting invitation:', error);
        throw new Error('Error al aceptar invitación');
      }

      if (!data.success) {
        throw new Error(data.error || 'Error al aceptar invitación');
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['userRole']);
      queryClient.invalidateQueries(['userOrganization']);
      queryClient.invalidateQueries(['teamMembers', data.organization_id]);
      toast.success('¡Bienvenido al equipo!');
    },
    onError: (error) => {
      console.error('Error accepting invitation:', error);
      toast.error(error.message || 'Error al aceptar invitación');
    },
  });
};

// ============================================
// Mutación: Rechazar invitación
// ============================================
export const useRejectInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId) => {
      const { error } = await supabase
        .from('team_invitations')
        .update({ status: 'rejected' })
        .eq('id', invitationId);

      if (error) {
        console.error('Error rejecting invitation:', error);
        throw new Error('Error al rechazar invitación');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myInvitations']);
      toast.success('Invitación rechazada');
    },
    onError: (error) => {
      console.error('Error rejecting invitation:', error);
      toast.error('Error al rechazar invitación');
    },
  });
};

// ============================================
// Mutación: Cancelar invitación (por quien la envió)
// ============================================
export const useCancelInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId) => {
      const { error } = await supabase
        .from('team_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) {
        console.error('Error canceling invitation:', error);
        throw new Error('Error al cancelar invitación');
      }
    },
    onSuccess: (_, invitationId) => {
      queryClient.invalidateQueries(['invitations']);
      toast.success('Invitación cancelada');
    },
    onError: (error) => {
      console.error('Error canceling invitation:', error);
      toast.error('Error al cancelar invitación');
    },
  });
};

// ============================================
// Mutación: Actualizar rol de miembro
// ============================================
export const useUpdateMemberRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, newRole, organizationId }) => {
      const { error } = await supabase
        .from('team_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) {
        console.error('Error updating member role:', error);
        throw new Error('Error al actualizar rol');
      }

      return { memberId, newRole, organizationId };
    },
    onSuccess: ({ organizationId }) => {
      queryClient.invalidateQueries(['teamMembers', organizationId]);
      toast.success('Rol actualizado exitosamente');
    },
    onError: (error) => {
      console.error('Error updating role:', error);
      toast.error('Error al actualizar rol');
    },
  });
};

// ============================================
// Mutación: Remover miembro del equipo
// ============================================
export const useRemoveTeamMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, organizationId }) => {
      const { error } = await supabase
        .from('team_members')
        .update({ status: 'inactive' })
        .eq('id', memberId);

      if (error) {
        console.error('Error removing team member:', error);
        throw new Error('Error al remover miembro');
      }

      return { memberId, organizationId };
    },
    onSuccess: ({ organizationId }) => {
      queryClient.invalidateQueries(['teamMembers', organizationId]);
      toast.success('Miembro removido del equipo');
    },
    onError: (error) => {
      console.error('Error removing member:', error);
      toast.error('Error al remover miembro');
    },
  });
};

// ============================================
// Mutación: Actualizar organización
// ============================================
export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, updates }) => {
      const { data, error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', organizationId)
        .select()
        .single();

      if (error) {
        console.error('Error updating organization:', error);
        throw new Error('Error al actualizar organización');
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['userOrganization']);
      toast.success('Organización actualizada');
    },
    onError: (error) => {
      console.error('Error updating organization:', error);
      toast.error('Error al actualizar organización');
    },
  });
};

// ============================================
// HOOKS PARA ROLES PERSONALIZADOS
// ============================================

// Hook para obtener roles personalizados de una organización
export const useCustomRoles = (organizationId) => {
  return useQuery({
    queryKey: ['customRoles', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('custom_roles')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching custom roles:', error);
        throw new Error('Error al cargar roles personalizados');
      }

      return data || [];
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook para crear un rol personalizado
export const useCreateCustomRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, name, description, color, icon, permissions }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('custom_roles')
        .insert([{
          organization_id: organizationId,
          name,
          description,
          color,
          icon,
          permissions,
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating custom role:', error);
        throw new Error(error.message || 'Error al crear rol personalizado');
      }

      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['customRoles', variables.organizationId]);
      toast.success(`Rol "${data.name}" creado exitosamente`);
    },
    onError: (error) => {
      console.error('Error creating custom role:', error);
      toast.error(error.message || 'Error al crear rol');
    },
  });
};

// Hook para actualizar un rol personalizado
export const useUpdateCustomRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roleId, organizationId, name, description, color, icon, permissions }) => {
      const { data, error } = await supabase
        .from('custom_roles')
        .update({
          name,
          description,
          color,
          icon,
          permissions,
        })
        .eq('id', roleId)
        .select()
        .single();

      if (error) {
        console.error('Error updating custom role:', error);
        throw new Error(error.message || 'Error al actualizar rol');
      }

      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['customRoles', variables.organizationId]);
      queryClient.invalidateQueries(['teamMembers', variables.organizationId]);
      toast.success(`Rol "${data.name}" actualizado`);
    },
    onError: (error) => {
      console.error('Error updating custom role:', error);
      toast.error(error.message || 'Error al actualizar rol');
    },
  });
};

// Hook para eliminar un rol personalizado
export const useDeleteCustomRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roleId, organizationId }) => {
      // Marcar como inactivo en lugar de eliminar
      const { data, error } = await supabase
        .from('custom_roles')
        .update({ is_active: false })
        .eq('id', roleId)
        .select()
        .single();

      if (error) {
        console.error('Error deleting custom role:', error);
        throw new Error(error.message || 'Error al eliminar rol');
      }

      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['customRoles', variables.organizationId]);
      queryClient.invalidateQueries(['teamMembers', variables.organizationId]);
      toast.success('Rol eliminado');
    },
    onError: (error) => {
      console.error('Error deleting custom role:', error);
      toast.error(error.message || 'Error al eliminar rol');
    },
  });
};

// Hook para asignar un rol personalizado a un miembro
export const useAssignCustomRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, customRoleId, organizationId }) => {
      const { data, error } = await supabase
        .from('team_members')
        .update({ custom_role_id: customRoleId })
        .eq('id', memberId)
        .select()
        .single();

      if (error) {
        console.error('Error assigning custom role:', error);
        throw new Error(error.message || 'Error al asignar rol');
      }

      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['teamMembers', variables.organizationId]);
      toast.success('Rol asignado exitosamente');
    },
    onError: (error) => {
      console.error('Error assigning custom role:', error);
      toast.error(error.message || 'Error al asignar rol');
    },
  });
};
