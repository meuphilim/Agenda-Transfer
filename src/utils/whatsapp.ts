export const sendWhatsAppMessage = async (phoneNumber: string, message: string) => {
  // Remove caracteres não numéricos do número
  const formattedNumber = phoneNumber.replace(/\D/g, '');
  
  // Cria a URL do WhatsApp
  const whatsappUrl = `https://api.whatsapp.com/send?phone=55${formattedNumber}&text=${encodeURIComponent(message)}`;
  
  // Abre o WhatsApp em uma nova janela
  window.open(whatsappUrl, '_blank');
};