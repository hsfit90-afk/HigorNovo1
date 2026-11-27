// Testes da grade de atendimento (lib/horarios.ts).
//
// Rode com:  npm test
//
// Usa o executor de testes embutido no Node (node:test) de propósito: não
// precisa de nenhuma dependência nova no projeto. O Node lê TypeScript
// direto, removendo os tipos na hora de executar.
//
// Estes testes já pegaram três erros reais antes de chegarem ao cliente:
// o tipo errado da chave no cancelamento, o horário de madrugada sumindo
// da lista e o fuso do calendário bloqueando o próprio dia.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  horariosDoDia,
  horariosAgendaveis,
  podeAgendar,
  ehMadrugada,
  ehAlmoco,
  diaSeguinteFormatado,
  hojeEmSaoPaulo,
  horaAgoraEmSaoPaulo,
  limiteDeAgendamento,
} from '../lib/horarios.ts';

describe('dezembro/2026 - datas definidas pelo barbeiro', () => {
  test('21/12 abre mais cedo, as 08:00, e vai ate 21:00', () => {
    assert.deepEqual(horariosAgendaveis('2026-12-21'), [
      '08:00', '09:00', '10:00', '11:00', '12:00',
      '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00',
    ]);
  });

  test('21/12 mostra o almoco riscado entre os dois blocos', () => {
    assert.deepEqual(
      horariosDoDia('2026-12-21').filter(h => h === '13:00' || h === '14:00'),
      ['13:00', '14:00'],
    );
  });

  test('22/12 atende 09-12 e 15-20', () => {
    assert.deepEqual(horariosAgendaveis('2026-12-22'), [
      '09:00', '10:00', '11:00', '12:00',
      '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
    ]);
  });

  test('23/12 vai ate a virada da noite', () => {
    assert.deepEqual(horariosAgendaveis('2026-12-23'), [
      '08:00', '09:00', '10:00', '11:00', '12:00',
      '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
      '21:00', '22:00', '23:00', '00:00',
    ]);
  });

  test('o 00:00 do dia 23 aparece por ultimo, nao por primeiro', () => {
    assert.equal(horariosDoDia('2026-12-23').at(-1), '00:00');
  });

  test('24/12 e meio periodo', () => {
    assert.deepEqual(horariosAgendaveis('2026-12-24'), [
      '10:00', '11:00', '12:00', '15:00', '16:00', '17:00', '18:00', '19:00',
    ]);
  });

  test('28, 29 e 30/12 tem o mesmo expediente', () => {
    const esperado = [
      '09:00', '10:00', '11:00', '12:00',
      '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
    ];
    for (const dia of ['2026-12-28', '2026-12-29', '2026-12-30']) {
      assert.deepEqual(horariosAgendaveis(dia), esperado, dia);
    }
  });

  test('31/12 fecha mais cedo', () => {
    assert.deepEqual(horariosAgendaveis('2026-12-31'), [
      '10:00', '11:00', '12:00', '15:00', '16:00', '17:00',
    ]);
  });
});

describe('folgas', () => {
  const folgas = [
    '2026-12-25', '2026-12-26', '2026-12-27',
    '2027-01-01', '2027-01-02', '2027-01-03', '2027-01-04', '2027-01-05',
  ];

  test('nenhum horario nos dias de folga', () => {
    for (const dia of folgas) assert.deepEqual(horariosDoDia(dia), [], dia);
  });

  test('nao da pra agendar em dia de folga', () => {
    for (const dia of folgas) assert.equal(podeAgendar(dia, '10:00'), false, dia);
  });
});

describe('grade semanal normal - nao pode ter mudado', () => {
  test('terca: 09:00 as 20:00, com almoco na lista', () => {
    assert.deepEqual(horariosDoDia('2026-12-01'), [
      '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
      '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
    ]);
  });

  test('segunda comeca as 15:00', () => {
    assert.deepEqual(horariosDoDia('2026-12-07'), [
      '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
    ]);
  });

  test('domingo e fechado', () => {
    assert.deepEqual(horariosDoDia('2026-12-06'), []);
    assert.deepEqual(horariosDoDia('2026-12-20'), []);
  });

  test('quarta termina as 19:00 e quinta as 17:00', () => {
    assert.equal(horariosDoDia('2026-12-02').at(-1), '19:00');
    assert.equal(horariosDoDia('2026-12-03').at(-1), '17:00');
  });

  test('sabado termina as 20:00', () => {
    assert.equal(horariosDoDia('2026-12-19').at(-1), '20:00');
  });
});

describe('trava de gravacao', () => {
  test('aceita horario que existe na grade', () => {
    assert.equal(podeAgendar('2026-12-31', '17:00'), true);
    assert.equal(podeAgendar('2026-12-21', '08:00'), true);
    assert.equal(podeAgendar('2026-12-23', '00:00'), true);
  });

  test('recusa horario fora da grade do dia', () => {
    assert.equal(podeAgendar('2026-12-31', '20:00'), false);
    assert.equal(podeAgendar('2026-12-01', '08:00'), false);
  });

  test('recusa o horario de almoco', () => {
    assert.equal(podeAgendar('2026-12-22', '13:00'), false);
    assert.equal(podeAgendar('2026-12-22', '14:00'), false);
  });

  test('recusa data ou hora em branco', () => {
    assert.equal(podeAgendar('', '10:00'), false);
    assert.equal(podeAgendar('2026-12-21', ''), false);
  });

  // Sem a conferencia de ida e volta, '2026-13-99' passava: o JavaScript
  // transborda calado para uma data valida e a trava de folga era furada
  // chamando a rota de pagamento direto, sem passar pela tela.
  test('recusa data que nao existe no calendario', () => {
    assert.equal(podeAgendar('2026-13-99', '09:00'), false);
    assert.equal(podeAgendar('2026-02-30', '09:00'), false);
    assert.equal(podeAgendar('2026-00-10', '09:00'), false);
  });

  test('recusa data fora do formato', () => {
    assert.equal(podeAgendar('2026-2-3', '09:00'), false);
    assert.equal(podeAgendar('21/12/2026', '09:00'), false);
    assert.equal(podeAgendar('abc', '09:00'), false);
  });

  test('recusa hora fora do formato', () => {
    assert.equal(podeAgendar('2026-12-21', '9:00'), false);
    assert.equal(podeAgendar('2026-12-21', '25:00'), false);
    assert.equal(podeAgendar('2026-12-21', '08:99'), false);
  });
});

describe('horario de madrugada', () => {
  test('00:00 conta como virada da noite', () => {
    assert.equal(ehMadrugada('00:00'), true);
    assert.equal(ehMadrugada('05:00'), true);
  });

  test('horario normal nao e madrugada', () => {
    assert.equal(ehMadrugada('09:00'), false);
    assert.equal(ehMadrugada('23:00'), false);
  });

  test('string vazia nao e madrugada', () => {
    assert.equal(ehMadrugada(''), false);
  });

  test('rotula a data certa do atendimento', () => {
    assert.equal(diaSeguinteFormatado('2026-12-23'), '24/12');
    assert.equal(diaSeguinteFormatado('2026-12-31'), '01/01');
  });

  test('almoco e reconhecido', () => {
    assert.equal(ehAlmoco('13:00'), true);
    assert.equal(ehAlmoco('14:00'), true);
    assert.equal(ehAlmoco('12:00'), false);
  });
});

describe('fuso horario de Sao Paulo', () => {
  const RelogioReal = Date;

  // Congela o relogio num instante UTC para testar a virada do dia.
  function congelar<T>(isoUtc: string, fn: () => T): T {
    class RelogioFalso extends RelogioReal {
      constructor(...args: unknown[]) {
        if (args.length === 0) {
          super(isoUtc);
        } else {
          // O construtor de Date tem várias assinaturas e o TypeScript não
          // consegue casá-las com uma lista de tamanho variável; aqui só
          // repassamos adiante o que veio.
          super(...(args as [number, number, number]));
        }
      }
      static now() {
        return new RelogioReal(isoUtc).getTime();
      }
    }
    globalThis.Date = RelogioFalso as DateConstructor;
    try {
      return fn();
    } finally {
      globalThis.Date = RelogioReal;
    }
  }

  // O caso que quebrava: das 21h em diante o UTC ja virou o dia seguinte e
  // o calendario bloqueava o proprio dia de hoje - justamente no 23/12, em
  // que o atendimento vai ate 00:00.
  test('23/12 as 21:10, 22:00 e 23:30 ainda e dia 23', () => {
    assert.equal(congelar('2026-12-24T00:10:00Z', hojeEmSaoPaulo), '2026-12-23');
    assert.equal(congelar('2026-12-24T01:00:00Z', hojeEmSaoPaulo), '2026-12-23');
    assert.equal(congelar('2026-12-24T02:30:00Z', hojeEmSaoPaulo), '2026-12-23');
  });

  test('o dia vira no horario certo, nao tres horas antes', () => {
    assert.equal(congelar('2026-12-24T03:30:00Z', hojeEmSaoPaulo), '2026-12-24');
  });

  test('virada do ano', () => {
    assert.equal(congelar('2027-01-01T01:00:00Z', hojeEmSaoPaulo), '2026-12-31');
  });

  test('hora em Sao Paulo', () => {
    assert.equal(congelar('2026-12-24T01:00:00Z', horaAgoraEmSaoPaulo), '22:00');
    assert.equal(congelar('2026-12-23T12:05:00Z', horaAgoraEmSaoPaulo), '09:05');
  });

  test('limite de 2 meses conta a partir da data em Sao Paulo', () => {
    assert.equal(congelar('2026-12-24T01:00:00Z', () => limiteDeAgendamento(2)), '2027-02-23');
    assert.equal(congelar('2026-11-27T18:00:00Z', () => limiteDeAgendamento(2)), '2027-01-27');
  });

  test('o limite nunca cai antes de hoje', () => {
    const hoje = congelar('2026-12-24T01:00:00Z', hojeEmSaoPaulo);
    const limite = congelar('2026-12-24T01:00:00Z', () => limiteDeAgendamento(2));
    assert.ok(limite > hoje);
  });
});
