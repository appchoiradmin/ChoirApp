using System;
using System.Threading.Tasks;

namespace ChoirApp.Domain.Services
{
    public interface IInvitationPolicy
    {
        Task<bool> CanBeCreated(Guid choirId, string email);
    }
}
