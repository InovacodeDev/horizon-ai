import Link from 'next/link';
import {
  BrainCircuitIcon,
  ShieldLockIcon,
  ZapIcon,
  UserPlusIcon,
  LinkIcon,
  SparklesIcon,
  CheckCircleIcon,
} from '@/components/assets/Icons';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

const FeatureCard = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <Card className="p-6 text-center h-full">
    <div className="inline-block p-3 bg-primary-container rounded-full mb-4">{icon}</div>
    <h3 className="text-lg font-medium text-on-surface mb-2">{title}</h3>
    <p className="text-sm text-on-surface-variant">{children}</p>
  </Card>
);

const TestimonialCard = ({ quote, name, role }: { quote: string; name: string; role: string }) => (
  <Card className="p-6 bg-primary/5 h-full">
    <blockquote className="text-on-surface-variant italic">"{quote}"</blockquote>
    <footer className="mt-4 text-right">
      <p className="font-medium text-on-surface">{name}</p>
      <p className="text-sm text-on-surface-variant">{role}</p>
    </footer>
  </Card>
);

const HowItWorksStep = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <div className="text-center">
    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-container rounded-full mb-4 text-primary">
      {icon}
    </div>
    <h4 className="text-xl font-medium text-on-surface mb-2">{title}</h4>
    <p className="text-on-surface-variant">{children}</p>
  </div>
);

const ProductPreview = () => (
  <div className="w-full max-w-5xl mx-auto bg-surface-container rounded-xl border border-outline shadow-xl p-2">
    <div className="flex items-center gap-1.5 p-2 border-b border-outline">
      <div className="w-3 h-3 rounded-full bg-outline"></div>
      <div className="w-3 h-3 rounded-full bg-outline"></div>
      <div className="w-3 h-3 rounded-full bg-outline"></div>
    </div>
    <div className="p-6 bg-surface grid grid-cols-3 gap-6">
      <div className="col-span-3">
        <div className="h-8 w-1/3 bg-outline/30 rounded"></div>
        <div className="h-5 w-1/2 bg-outline/30 rounded mt-2"></div>
      </div>
      <div className="col-span-3 bg-primary/5 p-6 rounded-lg text-center">
        <div className="h-5 w-1/4 bg-primary/20 rounded mx-auto"></div>
        <div className="h-12 w-1/2 bg-primary/20 rounded mt-2 mx-auto"></div>
      </div>
      <div className="col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 flex items-center bg-primary/5 rounded-lg">
            <div className="h-10 w-10 rounded-full mr-4 bg-primary/20" />
            <div className="flex-grow space-y-2">
              <div className="h-4 w-2/3 bg-primary/20 rounded" />
              <div className="h-5 w-1/2 bg-primary/20 rounded" />
            </div>
          </div>
        ))}
      </div>
      <div className="col-span-3 lg:col-span-2 bg-primary/5 p-4 rounded-lg">
        <div className="h-6 w-1/3 bg-primary/20 rounded mb-4"></div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center py-2">
              <div className="h-8 w-8 rounded-full mr-3 bg-primary/20" />
              <div className="flex-grow space-y-1">
                <div className="h-4 w-3/4 bg-primary/20 rounded" />
              </div>
              <div className="h-5 w-16 bg-primary/20 rounded" />
            </div>
          ))}
        </div>
      </div>
      <div className="col-span-3 lg:col-span-1 bg-primary/5 p-4 rounded-lg">
        <div className="h-6 w-1/2 bg-primary/20 rounded mb-4"></div>
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="p-3 bg-surface rounded-lg">
              <div className="h-5 w-3/4 bg-primary/20 rounded mb-2"></div>
              <div className="h-3 w-full bg-primary/20 rounded mb-1"></div>
              <div className="h-3 w-2/3 bg-primary/20 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const FeatureImagePlaceholder = ({ className }: { className?: string }) => (
  <div
    className={`aspect-video bg-primary/5 rounded-xl border border-outline p-8 flex items-center justify-center ${className || ''}`}
  >
    <div className="w-full h-full relative">
      <div className="absolute top-0 left-0 w-3/4 h-3/4 bg-primary/10 rounded-lg transform -rotate-6"></div>
      <div className="absolute bottom-0 right-0 w-3/4 h-3/4 bg-secondary/10 rounded-lg transform rotate-6"></div>
      <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm rounded-lg border border-outline flex items-center justify-center">
        <SparklesIcon className="w-16 h-16 text-primary/30" />
      </div>
    </div>
  </div>
);

export default function HomePage() {
  return (
    <div className="bg-surface min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-sm border-b border-outline transition-all duration-300">
        <div className="p-4 flex justify-between items-center max-w-7xl mx-auto">
          <h1 className="text-xl font-bold text-primary">Horizon AI</h1>
          <Link href="/login">
            <Button variant="outlined">Entrar</Button>
          </Link>
        </div>
      </header>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="text-center px-4 py-20 md:py-32">
          <h2 className="text-4xl md:text-6xl font-normal text-on-surface mb-4 max-w-4xl mx-auto">
            Sua vida financeira, finalmente em ordem.
          </h2>
          <p className="text-lg text-on-surface-variant max-w-2xl mx-auto mb-8">
            O Horizon AI conecta todas as suas contas para te dar uma visão completa e inteligente de suas
            finanças. Sem esforço.
          </p>
          <Link href="/register">
            <Button className="text-base h-12 px-8">Crie sua conta gratuita</Button>
          </Link>
          <p className="text-xs text-on-surface-variant mt-4">
            Grátis para começar. Não precisa de cartão de crédito.
          </p>
        </section>

        {/* Product Preview Section */}
        <section className="pb-20 md:pb-32 px-4">
          <ProductPreview />
        </section>

        {/* Detailed Features Section */}
        <section className="py-20 md:py-32 px-4 bg-surface-variant/10">
          <div className="max-w-6xl mx-auto space-y-24">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-normal text-on-surface mb-4">
                  Categorização e Insights Automáticos
                </h3>
                <p className="text-lg text-on-surface-variant mb-6">
                  Pare de categorizar transações manualmente. Nossa IA analisa seus gastos de forma
                  inteligente, atribui categorias e identifica tendências, economizando horas de
                  trabalho tedioso. Descubra para onde seu dinheiro realmente vai.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-secondary mr-2 mt-1 flex-shrink-0" />
                    <span>Mais de 95% de precisão na categorização automática.</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-secondary mr-2 mt-1 flex-shrink-0" />
                    <span>Identifique assinaturas recorrentes que você pode ter esquecido.</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-secondary mr-2 mt-1 flex-shrink-0" />
                    <span>Receba alertas sobre atividades de gastos incomuns.</span>
                  </li>
                </ul>
              </div>
              <FeatureImagePlaceholder />
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="md:order-2">
                <h3 className="text-3xl font-normal text-on-surface mb-4">
                  Rastreamento de Garantias e Faturas
                </h3>
                <p className="text-lg text-on-surface-variant mb-6">
                  Nunca mais perca um recibo ou a data de validade de uma garantia. Basta enviar suas
                  faturas e nós extrairemos automaticamente os detalhes do produto, datas de compra e
                  períodos de garantia.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-secondary mr-2 mt-1 flex-shrink-0" />
                    <span>
                      Armazenamento digital centralizado para todos os seus recibos importantes.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-secondary mr-2 mt-1 flex-shrink-0" />
                    <span>Receba lembretes antes que uma garantia expire.</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-secondary mr-2 mt-1 flex-shrink-0" />
                    <span>
                      Simplifique devoluções e reclamações com comprovantes de compra fáceis de
                      acessar.
                    </span>
                  </li>
                </ul>
              </div>
              <FeatureImagePlaceholder className="md:order-1" />
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-normal text-on-surface mb-4">
                  Planejamento de Aposentadoria e Metas
                </h3>
                <p className="text-lg text-on-surface-variant mb-6">
                  Visualize seu futuro financeiro. Defina metas como comprar uma casa, fazer uma
                  viagem ou se aposentar, e o Horizon AI projeta seu progresso e oferece insights para
                  você chegar lá mais rápido.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-secondary mr-2 mt-1 flex-shrink-0" />
                    <span>Crie múltiplas metas financeiras com prazos e valores alvo.</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-secondary mr-2 mt-1 flex-shrink-0" />
                    <span>Simule diferentes cenários de contribuição e investimento.</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-secondary mr-2 mt-1 flex-shrink-0" />
                    <span>
                      Entenda se você está no caminho certo para uma aposentadoria tranquila.
                    </span>
                  </li>
                </ul>
              </div>
              <FeatureImagePlaceholder />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 md:py-32">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h3 className="text-3xl font-normal">Comece em 3 passos simples</h3>
              <p className="text-lg text-on-surface-variant mt-2">
                A clareza financeira total está a apenas alguns minutos de distância.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-12">
              <HowItWorksStep icon={<UserPlusIcon className="w-8 h-8" />} title="1. Crie sua Conta">
                Cadastre-se gratuitamente em menos de um minuto. Não é necessário cartão de crédito.
              </HowItWorksStep>
              <HowItWorksStep icon={<LinkIcon className="w-8 h-8" />} title="2. Conecte seus Bancos">
                Vincule suas instituições financeiras com segurança usando o Open Finance. Nós nunca
                vemos suas senhas.
              </HowItWorksStep>
              <HowItWorksStep icon={<SparklesIcon className="w-8 h-8" />} title="3. Obtenha Clareza">
                Veja todas as suas finanças em um só lugar e deixe nossa IA fornecer insights
                personalizados.
              </HowItWorksStep>
            </div>
          </div>
        </section>

        {/* Main Features Section */}
        <section className="py-20 bg-primary/5">
          <div className="max-w-6xl mx-auto px-4">
            <h3 className="text-3xl font-normal text-center mb-12">Por que escolher o Horizon AI?</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<ZapIcon className="w-6 h-6 text-primary" />}
                title="Visão Unificada e Rápida"
              >
                Conecte contas bancárias e cartões em minutos com a tecnologia segura do Open Finance.
                Diga adeus às planilhas.
              </FeatureCard>
              <FeatureCard
                icon={<BrainCircuitIcon className="w-6 h-6 text-primary" />}
                title="Inteligência Proativa"
              >
                Muito além de um extrato. Nossa IA categoriza despesas, rastreia garantias e oferece
                insights para você economizar.
              </FeatureCard>
              <FeatureCard
                icon={<ShieldLockIcon className="w-6 h-6 text-primary" />}
                title="Segurança em Primeiro Lugar"
              >
                Seus dados são protegidos com criptografia de ponta a ponta. Sua privacidade e segurança
                são nossa prioridade.
              </FeatureCard>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 md:py-32">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-normal">Encontre o plano certo para você</h3>
              <p className="text-lg text-on-surface-variant mt-2">
                Comece de graça e evolua quando estiver pronto.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="p-8 border-2 border-primary/20 flex flex-col">
                <h4 className="text-2xl font-medium text-on-surface">Free</h4>
                <p className="text-on-surface-variant mb-6">Para começar a organizar suas finanças.</p>
                <p className="text-4xl font-bold mb-6">
                  R$ 0
                  <span className="text-base font-medium text-on-surface-variant">/para sempre</span>
                </p>
                <ul className="space-y-3 mb-8 flex-grow">
                  <li className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-secondary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Conexão com até 2 bancos</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-secondary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Categorização automática</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-secondary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Visão geral do balanço</span>
                  </li>
                </ul>
                <Link href="/register">
                  <Button variant="outlined" className="w-full">
                    Comece Gratuitamente
                  </Button>
                </Link>
              </Card>
              <Card className="p-8 border-2 border-primary flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-primary text-on-primary text-xs font-bold px-4 py-1 rounded-bl-lg">
                  MAIS POPULAR
                </div>
                <h4 className="text-2xl font-medium text-primary">Premium</h4>
                <p className="text-on-surface-variant mb-6">
                  Para controle total e planejamento futuro.
                </p>
                <p className="text-4xl font-bold mb-6">
                  R$ 29<span className="text-base font-medium text-on-surface-variant">/mês</span>
                </p>
                <ul className="space-y-3 mb-8 flex-grow">
                  <li className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-secondary mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <b>Tudo do Free, e mais:</b>
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-secondary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Contas bancárias ilimitadas</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-secondary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Processamento de faturas com IA</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-secondary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Rastreamento de garantias</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-secondary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Relatórios para Imposto de Renda</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-secondary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Planejamento de metas e aposentadoria</span>
                  </li>
                </ul>
                <Link href="/register">
                  <Button className="w-full">Assine o Premium</Button>
                </Link>
              </Card>
            </div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="py-20 bg-primary/5">
          <div className="max-w-5xl mx-auto px-4">
            <h3 className="text-3xl font-normal text-center mb-12">Amado por planejadores proativos</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <TestimonialCard
                quote="Pela primeira vez, sinto que tenho controle total sobre minhas finanças. A consolidação automática é mágica."
                name="Mariana P."
                role="Gerente de Projetos"
              />
              <TestimonialCard
                quote="O Horizon AI me economizou horas na declaração de impostos e até me lembrou de uma garantia que estava prestes a expirar. É indispensável."
                name="João V."
                role="Engenheiro de Software"
              />
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="text-center px-4 py-20">
          <h2 className="text-3xl font-normal text-on-surface mb-4">Pronto para assumir o controle?</h2>
          <p className="text-lg text-on-surface-variant mb-8">
            Comece sua jornada em direção à clareza financeira hoje mesmo.
          </p>
          <Link href="/register">
            <Button className="text-base h-12 px-8">Comece Gratuitamente</Button>
          </Link>
        </section>
      </main>

      <footer className="text-center p-6 text-sm text-on-surface-variant border-t border-outline">
        &copy; 2024 Horizon AI. Todos os direitos reservados.
      </footer>
    </div>
  );
}
