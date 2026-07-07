import React, { useState } from 'react';

const SEED_RESOURCES = [
  {
    id: 'res_1',
    subjectCode: 'CS501',
    subjectName: 'Computer Architecture',
    credits: 4,
    syllabus: [
      { unit: 'Unit I', title: 'Basic Structure of Computers', topic: 'Functional units, Basic operational concepts, Bus structures, Software performance, Memory locations and addresses, Memory operations, Instruction and instruction sequencing.' },
      { unit: 'Unit II', title: 'Arithmetic Operations', topic: 'Addition and subtraction of signed numbers, Design of fast adders, Multiplication of positive numbers, Signed operand multiplication, Fast multiplication, Integer division.' },
      { unit: 'Unit III', title: 'Basic Processing Unit', topic: 'Fundamental concepts, Execution of a complete instruction, Multiple bus organization, Hardwired control, Microprogrammed control.' },
      { unit: 'Unit IV', title: 'Memory System', topic: 'Basic concepts, Semiconductor RAM memories, Read only memories, Speed, Size, and Cost, Cache memories - Mapping functions, Replacement algorithms, Performance considerations.' },
    ]
  },
  {
    id: 'res_2',
    subjectCode: 'AI402',
    subjectName: 'Neural Networks',
    credits: 3,
    syllabus: [
      { unit: 'Unit I', title: 'Introduction to Brain and Neural Model', topic: 'Biological neural systems, Models of a Neuron, Neural Networks viewed as Directed Graphs, Feedback, Network Architectures, Knowledge Representation.' },
      { unit: 'Unit II', title: 'Learning Processes', topic: 'Error-correction Learning, Hebbian learning, Memory-based learning, Competitive learning, Boltzmann learning, Statistical learning.' },
      { unit: 'Unit III', title: 'Single Layer & Multilayer Perceptrons', topic: 'Adaptive filtering problem, Unconstrained optimization techniques, Linear least-squares filters, Least mean square algorithm, Back-propagation algorithms, XOR problem.' },
    ]
  },
];

const SEED_TIMETABLE = [
  { time: '09:30 AM', period: 'AM', subjectName: 'Computer Architecture (CS501)', room: 'Seminar Hall 3' },
  { time: '10:30 AM', period: 'AM', subjectName: 'Neural Networks (AI402)', room: 'Room 402' },
  { time: '11:30 AM', period: 'AM', subjectName: 'Design & Analysis of Algorithms', room: 'Lab 1' },
  { time: '02:00 PM', period: 'PM', subjectName: 'Discrete Mathematics (MA402)', room: 'Room 101' },
];

export default function AcademicResourcesView() {
  const [expandedSubject, setExpandedSubject] = useState<string | null>('res_1');

  const toggleSubject = (id: string) => {
    setExpandedSubject(expandedSubject === id ? null : id);
  };

  const handleContactRegistrar = () => {
    alert("Synthesizing connection to SJCE Registrar's Office... A ticket regarding attendance record revision has been initiated.");
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <section className="space-y-1">
        <span className="text-[10px] tracking-widest text-[#00687a] bg-[#00687a]/15 px-2.5 py-1 rounded-full font-sans font-extrabold uppercase">
          ACADEMIC RESOURCE DEEP-DIVE
        </span>
        <h2 className="text-2xl md:text-3xl font-display font-semibold text-[#191c1e] tracking-tight mt-1.5">
          Syllabi & Campus Schedules
        </h2>
        <p className="text-sm text-[#494454]">
          Review academic criteria, weekly classroom matrices, and download lecture briefs.
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Weekly Timetable List */}
        <div className="lg:col-span-4 acrylic-card rounded-2xl p-6 border border-[#cbc3d7]/30 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-[#cbc3d7]/20">
            <h3 className="font-display font-bold text-[#191c1e] text-base">Weekly Timetable</h3>
            <span className="text-[9px] uppercase font-sans text-green-700 font-extrabold flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
              Today
            </span>
          </div>

          <div className="space-y-3">
            {SEED_TIMETABLE.map((item, idx) => (
              <div 
                key={idx}
                className="p-3.5 bg-white/60 hover:bg-white/90 border border-transparent hover:border-[#6b38d4]/10 rounded-xl transition-all duration-200"
              >
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-mono text-xs text-[#6b38d4] font-bold">{item.time}</span>
                  <span className="text-[10px] font-sans font-bold text-[#7b7486] uppercase bg-slate-100 px-2 py-0.5 rounded">
                    {item.room}
                  </span>
                </div>
                <p className="font-display font-bold text-sm text-[#191c1e] leading-snug">
                  {item.subjectName}
                </p>
              </div>
            ))}
          </div>

          {/* Contact Representative Callout */}
          <div className="mt-4 pt-4 border-t border-[#cbc3d7]/20 bg-[#6b38d4]/5 rounded-xl p-4 border border-[#6b38d4]/10">
            <p className="text-xs font-sans text-[#494454] leading-relaxed mb-3">
              Noticed any timing conflict or missing check-in logs? Get in touch with registrar representative.
            </p>
            <button
              onClick={handleContactRegistrar}
              className="w-full text-xs font-sans font-bold bg-[#6b38d4] hover:bg-[#8455ef] text-white py-2.5 rounded-lg transition-colors cursor-pointer text-center"
            >
              Contact Registrar Office
            </button>
          </div>

        </div>

        {/* Syllabus Accordion Grid Panels */}
        <div className="lg:col-span-8 space-y-4">
          
          <h3 className="text-xs font-sans font-bold tracking-widest text-[#7b7486] uppercase select-none mb-2 block">
            CORE MATHEMATICS & CS LAB CRITERIA
          </h3>

          <div className="space-y-3">
            {SEED_RESOURCES.map((subject) => {
              const isExpanded = expandedSubject === subject.id;
              return (
                <div 
                  key={subject.id}
                  className="acrylic-card rounded-2xl overflow-hidden transition-all duration-300"
                >
                  {/* Collateral trigger bar */}
                  <button
                    onClick={() => toggleSubject(subject.id)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-[#6b38d4]/5 transition-colors cursor-pointer"
                  >
                    <div>
                      <span className="text-[10px] text-[#6b38d4] font-sans font-bold uppercase tracking-wider">
                        {subject.subjectCode} &bull; {subject.credits} Credits
                      </span>
                      <h4 className="font-display font-bold text-base text-[#191c1e] mt-0.5">
                        {subject.subjectName}
                      </h4>
                    </div>
                    <span className="material-symbols-outlined text-[#7b7486]">
                      {isExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>

                  {/* Accordion detail pane */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 border-t border-[#6b38d4]/5 bg-white/40 divide-y divide-[#cbc3d7]/20">
                      {subject.syllabus.map((uni, uIdx) => (
                        <div key={uIdx} className="py-3.5 space-y-1">
                          <span className="text-[10px] font-sans font-bold text-[#00687a] bg-[#00687a]/15 px-2 py-0.5 rounded uppercase">
                            {uni.unit} &bull; {uni.title}
                          </span>
                          <p className="text-xs text-[#494454] leading-relaxed pt-1.5 pl-0.5">
                            {uni.topic}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              );
            })}
          </div>

        </div>

      </div>
    </div>
  );
}
