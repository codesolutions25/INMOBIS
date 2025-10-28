export async function changePasswordForCompanyUser(
    username: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Para usuarios de empresa, intentar directamente con el endpoint específico
      const updateResponse = await fetch(`/api/proxy?service=auth&path=empresa/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          username,
          currentPassword,
          newPassword
        }),
        credentials: 'include',
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || 'Error al actualizar la contraseña de empresa'
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error al cambiar la contraseña de empresa:', error);
      return {
        success: false,
        error: 'Error de conexión. Intente nuevamente.'
      };
    }
  }
