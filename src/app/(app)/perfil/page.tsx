
import { auth } from '@/lib/auth';
import { findUserByAssociateNumber, getPhoneState } from '@/lib/data';
import { ReportDeviceButton, ReportedDeviceSteps } from '@/components/report-device';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { KeyRound, Mail, Phone, Smartphone, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { ForgotNipForm } from '@/app/login/forgot-nip-form';
import { Suspense } from 'react';
import Loading from './loading';

const InfoRow = ({ icon, label, value }: { icon: React.ElementType, label: string, value?: string | null }) => {
    const Icon = icon;
    return (
        <div className="flex items-center gap-4 py-2 border-b border-dashed">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-medium text-sm">{value || 'No disponible'}</p>
            </div>
        </div>
    );
};

async function ProfileContent() {
    const session = await auth();
    if (!session?.user?.associateNumber) {
        return <p>No se pudo cargar la información de la asociada.</p>;
    }

    const [user, phoneState] = await Promise.all([
        findUserByAssociateNumber(session.user.associateNumber),
        getPhoneState(session.user.associateNumber),
    ]);
    const device = phoneState?.dispositivo;
    const canReport = device?.estatus === 'ACTIVO' || device?.estatus === 'BLOQUEADO';
    const getInitials = (name: string) => {
        const names = name.split(' ');
        if (names.length > 1) {
            return `${names[0][0]}${names[1][0]}`;
        }
        return names[0].substring(0, 2);
    };

    return (
        <div className="p-4 md:p-6 lg:p-8">
             <div className="mb-6">
                <h1 className="text-base font-bold font-headline">Mi Perfil</h1>
                <p className="font-headline text-sm text-muted-foreground">Consulta y gestiona la información de tu cuenta.</p>
            </div>

            <Card className="max-w-md mx-auto shadow-sm">
                <CardHeader className="items-center text-center p-4">
                    <Avatar className="h-20 w-20 mb-2 border-2 border-primary">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                            {user?.name ? getInitials(user.name) : 'PG'}
                        </AvatarFallback>
                    </Avatar>
                    <CardTitle className="font-headline text-base">{user?.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">Asociada PrestaGana+</p>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <InfoRow icon={User} label="No. de Asociada" value={user?.associateNumber} />
                    <InfoRow icon={Mail} label="Email" value={user?.email} />
                    <InfoRow icon={Phone} label="Teléfono" value={user?.phone} />
                    <div className="mt-6">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="w-full">
                                    <KeyRound className="mr-2" />
                                    Restablecer NIP
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md p-0">
                                <DialogHeader className="p-4 pb-0">
                                    <DialogTitle className="font-headline">Restablecer NIP</DialogTitle>
                                    <DialogDescription>
                                        Ponte en contacto con soporte para recibir ayuda.
                                    </DialogDescription>
                                </DialogHeader>
                                <ForgotNipForm />
                            </DialogContent>
                        </Dialog>
                    </div>
                    {device && (
                        <div className="mt-4 space-y-2 border-t pt-4">
                            <InfoRow icon={Smartphone} label="Mi equipo PrestaGana" value={`${device.modelo} · IMEI ${device.ultimos4Imei}`} />
                            {canReport ? (
                                <ReportDeviceButton deviceLabel={`${device.modelo}, IMEI terminación ${device.ultimos4Imei}`} />
                            ) : (
                                <ReportedDeviceSteps />
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function ProfilePage() {
    return (
        <Suspense fallback={<Loading />}>
            <ProfileContent />
        </Suspense>
    );
}
