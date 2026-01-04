<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushMessage;
use NotificationChannels\WebPush\WebPushChannel;
use App\Models\User;

class GlobalLeaderboardChanged extends Notification
{
    use Queueable;

    protected $newLeader;

    /**
     * Create a new notification instance.
     */
    public function __construct(User $newLeader)
    {
        $this->newLeader = $newLeader;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return [WebPushChannel::class];
    }

    /**
     * Get the mail representation of the notification.
     */
    /*
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->line('The introduction to the notification.')
            ->action('Notification Action', url('/'))
            ->line('Thank you for using our application!');
    }
    */

    /**
     * Get the array representation of the notification.
     *
     * @return WebPushMessage
     */
    /*
    public function toArray(object $notifiable): array
    {
        return [
            //
        ];
    }
    */

    public function toWebPush($notifiable, $notification)
    {
        return (new WebPushMessage)
            ->title('New leader in the scoreboard!')
            ->body('The player ' . $this->newLeader->nickname . ' is now leading the global scoreboard.')
            ->data(['url' => '/leaderboard'])
            ->action('View', 'view_app');
    }
}
