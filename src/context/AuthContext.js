import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [permissions, setPermissions] = useState(null);

  // Cargar perfil del usuario y su organización
  const loadUserProfile = async (userId) => {
    if (!userId) {
      setUserProfile(null);
      setOrganization(null);
      setPermissions(null);
      return;
    }

    try {
      console.log('🔄 Cargando perfil para userId:', userId);
      
      // Obtener perfil del usuario
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        console.error('❌ Error loading user profile:', profileError);
        return;
      }

      console.log('✅ Perfil cargado:', profile);
      setUserProfile(profile);

      // Obtener organización principal (si es owner) o buscar en team_members
      let orgId = profile.organization_id;
      let effectiveRole = profile.role;
      
      // Verificar si hay una organización seleccionada manualmente
      const selectedOrgId = localStorage.getItem('selected_organization_id');
      
      // Obtener TODAS las organizaciones del usuario
      const { data: memberships } = await supabase
        .from('team_members')
        .select('organization_id, role')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('joined_at', { ascending: false });
      
      // Si hay una organización seleccionada manualmente, usarla
      if (selectedOrgId) {
        // Verificar que el usuario tiene acceso a esa organización
        const selectedMembership = memberships?.find(m => m.organization_id === selectedOrgId);
        
        if (selectedMembership) {
          orgId = selectedOrgId;
          effectiveRole = selectedMembership.role;
          console.log('🎯 Usando organización seleccionada manualmente:', { orgId, role: effectiveRole });
        } else if (selectedOrgId === profile.organization_id) {
          // Es su organización principal
          orgId = profile.organization_id;
          effectiveRole = profile.role;
          console.log('🎯 Usando organización principal seleccionada:', { orgId, role: effectiveRole });
        } else {
          // La organización seleccionada ya no existe o no tiene acceso
          localStorage.removeItem('selected_organization_id');
          console.warn('⚠️ Organización seleccionada no válida, usando por defecto');
        }
      }
      
      // Si no hay orgId aún, usar la primera membresía o la principal
      if (!orgId && memberships && memberships.length > 0) {
        orgId = memberships[0].organization_id;
        effectiveRole = memberships[0].role;
        console.log('🔄 Usando primera membresía disponible:', { orgId, role: effectiveRole });
      }

      if (orgId) {
        // Obtener organización
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', orgId)
          .single();

        if (!orgError && org) {
          console.log('✅ Organización cargada:', org);
          setOrganization(org);

          // Actualizar el perfil con el rol efectivo y organization_id si viene de team_members
          if (effectiveRole !== profile.role || orgId !== profile.organization_id) {
            const updatedProfile = {
              ...profile,
              role: effectiveRole,
              organization_id: orgId // ✅ IMPORTANTE: Actualizar organization_id para que otros componentes lo usen
            };
            setUserProfile(updatedProfile);
            console.log('🔄 Perfil actualizado:', { 
              role: effectiveRole, 
              organization_id: orgId 
            });
          }

          // Obtener permisos
          const { data: perms, error: permsError } = await supabase
            .rpc('get_user_permissions', { org_id: orgId });

          if (!permsError && perms) {
            console.log('✅ Permisos cargados:', perms);
            setPermissions(perms);
          } else {
            console.error('❌ Error loading permissions:', permsError);
          }
        } else {
          console.error('❌ Error loading organization:', orgError);
        }
      } else {
        console.warn('⚠️ No organization_id found for user');
      }
    } catch (error) {
      console.error('❌ Error loading user data:', error);
    }
  };

  useEffect(() => {
    // Cargar sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      }
      setLoading(false);
    });

    // Escuchar cambios de autenticación
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth event:', event, 'User:', session?.user?.email);
      
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
        
        // Auto-aceptar invitación pendiente si existe token en localStorage
        const pendingToken = localStorage.getItem('pending_invitation_token');
        const isProcessing = localStorage.getItem('processing_invitation');
        
        // Solo procesar si hay token, NO se está procesando, y es un evento SIGNED_IN
        if (pendingToken && !isProcessing && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
          console.log('🎯 Token de invitación detectado, auto-aceptando...');
          
          // Marcar como procesando INMEDIATAMENTE
          localStorage.setItem('processing_invitation', 'true');
          
          try {
            // Buscar la invitación con el token
            const { data: invitation, error: invError } = await supabase
              .from('team_invitations')
              .select('*')
              .eq('token', pendingToken)
              .eq('status', 'pending')
              .single();

            if (invError || !invitation) {
              console.error('❌ Invitación no encontrada o ya procesada:', invError);
              localStorage.removeItem('pending_invitation_token');
              localStorage.removeItem('processing_invitation');
              return;
            }

            // Verificar que no expiró
            if (new Date(invitation.expires_at) < new Date()) {
              console.error('❌ Invitación expirada');
              localStorage.removeItem('pending_invitation_token');
              localStorage.removeItem('processing_invitation');
              return;
            }

            console.log('📧 Invitación encontrada:', invitation);

            // Crear el registro en team_members
            const { error: memberError } = await supabase
              .from('team_members')
              .insert({
                organization_id: invitation.organization_id,
                user_id: session.user.id,
                role: invitation.role,
                status: 'active',
                invited_by: invitation.invited_by
              });

            if (memberError) {
              console.error('❌ Error creando team_member:', memberError);
              localStorage.removeItem('pending_invitation_token');
              localStorage.removeItem('processing_invitation');
              return;
            }

            // Actualizar el estado de la invitación
            await supabase
              .from('team_invitations')
              .update({ 
                status: 'accepted',
                accepted_at: new Date().toISOString()
              })
              .eq('id', invitation.id);

            console.log('✅ Invitación aceptada exitosamente!');
            
            // Limpiar tokens
            localStorage.removeItem('pending_invitation_token');
            localStorage.removeItem('processing_invitation');
            
            // Recargar perfil después de 1 segundo
            setTimeout(() => {
              console.log('🔄 Recargando perfil...');
              loadUserProfile(session.user.id).then(() => {
                // Navegar al dashboard después de recargar perfil
                setTimeout(() => {
                  console.log('✅ Navegando al dashboard...');
                  window.location.href = '/dashboard';
                }, 500);
              });
            }, 1000);

          } catch (err) {
            console.error('❌ Error crítico en auto-aceptar:', err);
            localStorage.removeItem('pending_invitation_token');
            localStorage.removeItem('processing_invitation');
            // Navegar al dashboard de todas formas
            window.location.href = '/dashboard';
          }
        }
      } else {
        setUserProfile(null);
        setOrganization(null);
        setPermissions(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Función para recargar perfil (útil después de cambios)
  const refreshProfile = () => {
    if (user) {
      loadUserProfile(user.id);
    }
  };

  // Helper para verificar si tiene un permiso específico
  const hasPermission = (permission) => {
    if (!permissions || !permissions.permissions) return false;
    return permissions.permissions[permission] === true;
  };

  // Helper para verificar si tiene un rol específico
  const hasRole = (...roles) => {
    if (!userProfile) return false;
    return roles.includes(userProfile.role);
  };

  // Helper específico para verificar si es owner
  const hasRoleOwner = userProfile?.role === 'owner';

  const value = {
    user,
    loading,
    userProfile,
    organization,
    permissions,
    refreshProfile,
    hasPermission,
    hasRole,
    hasRoleOwner
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
